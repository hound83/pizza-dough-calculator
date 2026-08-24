const MAX_REQUEST_BYTES=16_384;
const TURNSTILE_ACTION='pizza_feedback';
const GITHUB_API_VERSION='2022-11-28';
const CATEGORIES={
  bug:'Bug',
  idea:'Idea',
  calculation:'Calculation or recipe',
  translation:'Language or translation'
};

function allowedOrigins(env){
  return new Set(String(env.ALLOWED_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean));
}

function requestOrigin(request){return String(request.headers.get('Origin')||'').trim();}

function corsHeaders(origin){
  return {
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Max-Age':'86400',
    'Cache-Control':'no-store',
    'Content-Security-Policy':"default-src 'none'",
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff',
    'Vary':'Origin'
  };
}

function json(data,status=200,origin=''){
  const headers={
    'Cache-Control':'no-store',
    'Content-Security-Policy':"default-src 'none'",
    'Content-Type':'application/json; charset=utf-8',
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff'
  };
  if(origin)Object.assign(headers,corsHeaders(origin));
  return new Response(JSON.stringify(data),{status,headers});
}

function cleanText(value,max){
  return typeof value==='string'?value.replace(/\u0000/g,'').trim().slice(0,max):'';
}

function cleanSummary(value){return cleanText(value,120).replace(/[\r\n\t]+/g,' ');}

function containsEmail(value){return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);}

function sanitizeDiagnostics(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const diagnostics={};
  if(typeof value.appVersion==='string'&&/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(value.appVersion))diagnostics.appVersion=value.appVersion.slice(0,32);
  if(value.language==='nl'||value.language==='en')diagnostics.language=value.language;
  if(value.experienceMode==='basic'||value.experienceMode==='full')diagnostics.experienceMode=value.experienceMode;
  if(['dough','sauce','full'].includes(value.outputMode))diagnostics.outputMode=value.outputMode;
  if(Number.isInteger(value.wizardPage)&&value.wizardPage>=0&&value.wizardPage<=4)diagnostics.wizardPage=value.wizardPage;
  if(typeof value.viewport==='string'&&/^\d{1,5}x\d{1,5}$/.test(value.viewport))diagnostics.viewport=value.viewport;
  return Object.keys(diagnostics).length?diagnostics:null;
}

function validatePayload(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return {error:'invalid_request'};
  const payload={
    category:cleanText(value.category,32),
    summary:cleanSummary(value.summary),
    message:cleanText(value.message,4000),
    steps:cleanText(value.steps,1500),
    website:cleanText(value.website,200),
    language:value.language==='en'?'en':'nl',
    turnstileToken:cleanText(value.turnstileToken,2048),
    diagnostics:sanitizeDiagnostics(value.diagnostics)
  };
  if(!Object.hasOwn(CATEGORIES,payload.category)||payload.summary.length<3||payload.message.length<10||!payload.turnstileToken)return {error:'invalid_request'};
  if(containsEmail(`${payload.summary}\n${payload.message}\n${payload.steps}`))return {error:'personal_data'};
  return {payload};
}

function configuredRepository(env){
  const repository=String(env.GITHUB_REPOSITORY||'').trim();
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)?repository:'';
}

function serviceConfigured(env){
  return Boolean(configuredRepository(env)&&String(env.GITHUB_TOKEN||'').trim()&&String(env.TURNSTILE_SECRET_KEY||'').trim()&&String(env.TURNSTILE_SITE_KEY||'').trim()&&typeof env.FEEDBACK_RATE_LIMITER?.limit==='function');
}

async function rateLimitAllows(origin,env){
  try{
    const result=await env.FEEDBACK_RATE_LIMITER.limit({key:`feedback:${origin}`});
    return result?.success===true;
  }catch(error){return false}
}

async function verifyTurnstile(payload,request,env,fetchImpl){
  const body=new FormData();
  body.set('secret',String(env.TURNSTILE_SECRET_KEY));
  body.set('response',payload.turnstileToken);
  const remoteIp=request.headers.get('CF-Connecting-IP');
  if(remoteIp)body.set('remoteip',remoteIp);
  if(globalThis.crypto?.randomUUID)body.set('idempotency_key',crypto.randomUUID());
  let response;
  try{
    response=await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
  }catch(error){return {ok:false,unavailable:true}}
  if(!response.ok)return {ok:false,unavailable:true};
  let result;
  try{result=await response.json();}catch(error){return {ok:false,unavailable:true}}
  const expectedHostname=String(env.TURNSTILE_EXPECTED_HOSTNAME||'').trim();
  const expectedAction=String(env.TURNSTILE_EXPECTED_ACTION||TURNSTILE_ACTION).trim();
  const actionMatches=result.action===expectedAction;
  const hostnameMatches=!expectedHostname||result.hostname===expectedHostname;
  return {ok:result.success===true&&actionMatches&&hostnameMatches};
}

function neutralizeMentions(value){return String(value).replace(/@/g,'@\u200b');}

function quoteMarkdown(value){return neutralizeMentions(value).split('\n').map(line=>`> ${line||' '}`).join('\n');}

function issueBody(payload){
  const sections=[
    '## Submitted feedback',
    '',
    `**Category:** ${CATEGORIES[payload.category]}`,
    `**Interface language:** ${payload.language==='en'?'English':'Dutch'}`,
    '',
    '### Message',
    quoteMarkdown(payload.message)
  ];
  if(payload.steps){
    sections.push('','### Steps to reproduce',quoteMarkdown(payload.steps));
  }
  if(payload.diagnostics){
    sections.push('','<details>','<summary>Opt-in technical context</summary>','',`\`\`\`json\n${JSON.stringify(payload.diagnostics,null,2)}\n\`\`\``,'</details>');
  }
  sections.push('','---',`Submitted anonymously through the pizza calculator v${payload.diagnostics?.appVersion||'1.2'} feedback form. The form does not collect recipe values, dough-log data, email addresses, or browser storage.`);
  return sections.join('\n');
}

async function createGitHubIssue(payload,env,fetchImpl){
  const repository=configuredRepository(env);
  let response;
  try{
    response=await fetchImpl(`https://api.github.com/repos/${repository}/issues`,{
      method:'POST',
      headers:{
        'Accept':'application/vnd.github+json',
        'Authorization':`Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type':'application/json',
        'User-Agent':'pizza-dough-feedback-worker',
        'X-GitHub-Api-Version':GITHUB_API_VERSION
      },
      body:JSON.stringify({
        title:`[Feedback: ${CATEGORIES[payload.category]}] ${neutralizeMentions(payload.summary)}`,
        body:issueBody(payload)
      })
    });
  }catch(error){return {ok:false}}
  if(!response.ok)return {ok:false,status:response.status};
  let issue;
  try{issue=await response.json();}catch(error){return {ok:false}}
  const issueUrl=typeof issue.html_url==='string'&&issue.html_url.startsWith(`https://github.com/${repository}/issues/`)?issue.html_url:'';
  const issueNumber=Number.isInteger(issue.number)?issue.number:null;
  return issueUrl&&issueNumber?{ok:true,issueUrl,issueNumber}:{ok:false};
}

async function readJsonBody(request){
  const declaredLength=Number(request.headers.get('Content-Length')||0);
  if(Number.isFinite(declaredLength)&&declaredLength>MAX_REQUEST_BYTES)return {error:'too_large'};
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_REQUEST_BYTES)return {error:'too_large'};
  try{return {value:JSON.parse(raw)}}catch(error){return {error:'invalid_json'}}
}

async function handleRequest(request,env,fetchImpl=fetch){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/health')return json({ok:true});

  const origin=requestOrigin(request);
  if(!origin||!allowedOrigins(env).has(origin))return json({ok:false,code:'origin_forbidden'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(origin)});

  if(request.method==='GET'&&url.pathname==='/config'){
    return json({enabled:serviceConfigured(env),siteKey:serviceConfigured(env)?String(env.TURNSTILE_SITE_KEY):''},200,origin);
  }
  if(request.method!=='POST'||url.pathname!=='/feedback')return json({ok:false,code:'not_found'},404,origin);
  if(!String(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return json({ok:false,code:'invalid_request'},415,origin);
  if(!serviceConfigured(env))return json({ok:false,code:'not_configured'},503,origin);

  const parsed=await readJsonBody(request);
  if(parsed.error)return json({ok:false,code:'invalid_request'},400,origin);
  // Check the honeypot before requiring any visible field or challenge token.
  // Simple form bots therefore receive no signal that their payload was dropped.
  if(cleanText(parsed.value?.website,200))return json({ok:true},202,origin);
  const validated=validatePayload(parsed.value);
  if(validated.error==='personal_data')return json({ok:false,code:'personal_data'},400,origin);
  if(validated.error)return json({ok:false,code:'invalid_request'},400,origin);
  const payload=validated.payload;

  const turnstile=await verifyTurnstile(payload,request,env,fetchImpl);
  if(!turnstile.ok)return json({ok:false,code:turnstile.unavailable?'service_unavailable':'captcha_failed'},turnstile.unavailable?502:400,origin);

  // Invalid tokens cannot consume the shared issue quota. A verified token is
  // still rate-limited before the GitHub credential is used.
  if(!await rateLimitAllows(origin,env))return json({ok:false,code:'rate_limited'},429,origin);

  const issue=await createGitHubIssue(payload,env,fetchImpl);
  if(!issue.ok)return json({ok:false,code:'service_unavailable'},502,origin);
  return json({ok:true,issueUrl:issue.issueUrl,issueNumber:issue.issueNumber},201,origin);
}

export {CATEGORIES,MAX_REQUEST_BYTES,TURNSTILE_ACTION,handleRequest,issueBody,sanitizeDiagnostics,validatePayload};
export default {fetch(request,env){return handleRequest(request,env)}};
