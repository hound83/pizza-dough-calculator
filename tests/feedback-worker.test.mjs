import assert from 'node:assert/strict';
import test from 'node:test';
import {fenceMarkdown,handleRequest,issueBody,sanitizeDiagnostics,validatePayload} from '../feedback-worker/src/index.js';

const ORIGIN='https://hound83.github.io';
const WORKER_URL='https://feedback.example.test';
const ENV={
  ALLOWED_ORIGINS:ORIGIN,
  GITHUB_REPOSITORY:'hound83/pizza-dough-calculator',
  GITHUB_TOKEN:'github-secret-token',
  TURNSTILE_SECRET_KEY:'turnstile-secret-token',
  TURNSTILE_SITE_KEY:'1x00000000000000000000AA',
  TURNSTILE_EXPECTED_ACTION:'pizza_feedback',
  TURNSTILE_EXPECTED_HOSTNAME:'hound83.github.io',
  FEEDBACK_REQUEST_LIMITER:{limit:async()=>({success:true})},
  FEEDBACK_RATE_LIMITER:{limit:async()=>({success:true})}
};

function request(path,{method='GET',body,origin=ORIGIN,contentType='application/json',clientIp='203.0.113.7'}={}){
  const headers={};
  if(origin!=null)headers.Origin=origin;
  if(clientIp!=null)headers['CF-Connecting-IP']=clientIp;
  if(body!==undefined)headers['Content-Type']=contentType;
  return new Request(`${WORKER_URL}${path}`,{method,headers,body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});
}

function validPayload(overrides={}){
  return {
    category:'bug',
    summary:'Picker button is clipped',
    message:'The final picker button is outside the visible area.',
    steps:'Open Complete pizzas and choose a recipe.',
    website:'',
    language:'en',
    turnstileToken:'valid-turnstile-token',
    ...overrides
  };
}

function successfulExternalFetch(calls=[]){
  return async(url,options={})=>{
    calls.push({url:String(url),options});
    if(String(url).includes('/siteverify')){
      return Response.json({success:true,action:'pizza_feedback',hostname:'hound83.github.io'});
    }
    if(String(url).includes('api.github.com')){
      return Response.json({number:42,html_url:'https://github.com/hound83/pizza-dough-calculator/issues/42'},{status:201});
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
}

test('health is public but reveals no configuration',async()=>{
  const response=await handleRequest(request('/health',{origin:null}),ENV,async()=>{throw new Error('unused')});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ok:true});
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});

test('configuration is CORS restricted and never returns secrets',async()=>{
  const denied=await handleRequest(request('/config',{origin:'https://evil.example'}),ENV,async()=>{throw new Error('unused')});
  assert.equal(denied.status,403);
  assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);

  const allowed=await handleRequest(request('/config'),ENV,async()=>{throw new Error('unused')});
  assert.equal(allowed.status,200);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  assert.equal(allowed.headers.get('X-Content-Type-Options'),'nosniff');
  const body=await allowed.json();
  assert.deepEqual(body,{enabled:true,siteKey:ENV.TURNSTILE_SITE_KEY});
  assert.equal(JSON.stringify(body).includes(ENV.GITHUB_TOKEN),false);
  assert.equal(JSON.stringify(body).includes(ENV.TURNSTILE_SECRET_KEY),false);
});

test('configuration remains disabled until every required binding exists',async()=>{
  for(const key of ['GITHUB_REPOSITORY','GITHUB_TOKEN','TURNSTILE_SECRET_KEY','TURNSTILE_SITE_KEY','TURNSTILE_EXPECTED_HOSTNAME','FEEDBACK_REQUEST_LIMITER','FEEDBACK_RATE_LIMITER']){
    const env={...ENV,[key]:''};
    const response=await handleRequest(request('/config'),env,async()=>{throw new Error('unused')});
    assert.deepEqual(await response.json(),{enabled:false,siteKey:''},key);
  }
});

test('the request limiter fails closed before Turnstile validation',async()=>{
  let requestLimitKey='';
  const env={
    ...ENV,
    FEEDBACK_REQUEST_LIMITER:{limit:async({key})=>{requestLimitKey=key;return {success:false};}}
  };
  const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload()}),env,async()=>{throw new Error('must not run')});
  assert.equal(response.status,429);
  assert.deepEqual(await response.json(),{ok:false,code:'rate_limited'});
  assert.equal(requestLimitKey,'feedback-request:203.0.113.7');
});

test('the shared issue limiter fails closed after Turnstile and before GitHub',async()=>{
  const externalCalls=[];
  let requestLimitKey='',issueLimitKey='';
  const env={
    ...ENV,
    FEEDBACK_REQUEST_LIMITER:{limit:async({key})=>{requestLimitKey=key;return {success:true};}},
    FEEDBACK_RATE_LIMITER:{limit:async({key})=>{issueLimitKey=key;return {success:false};}}
  };
  const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload()}),env,async url=>{
    externalCalls.push(String(url));
    assert.match(String(url),/siteverify$/);
    return Response.json({success:true,action:'pizza_feedback',hostname:'hound83.github.io'});
  });
  assert.equal(response.status,429);
  assert.deepEqual(await response.json(),{ok:false,code:'rate_limited'});
  assert.equal(requestLimitKey,'feedback-request:203.0.113.7');
  assert.equal(issueLimitKey,`feedback-issue:${ORIGIN}`);
  assert.equal(externalCalls.length,1);
});

test('preflight returns only the narrow feedback API contract',async()=>{
  const response=await handleRequest(request('/feedback',{method:'OPTIONS'}),ENV,async()=>{throw new Error('unused')});
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'),'GET,POST,OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'),'Content-Type');
});

test('valid anonymous feedback verifies Turnstile and creates a bounded GitHub issue',async()=>{
  const calls=[];
  const payload=validPayload({
    summary:'Picker mentions @octocat',
    diagnostics:{
      appVersion:'1.3.0',language:'en',experienceMode:'basic',outputMode:'full',wizardPage:3,viewport:'320x568',
      hydration:72,localStorage:'must never pass through',userAgent:'must never pass through'
    }
  });
  const response=await handleRequest(request('/feedback',{method:'POST',body:payload}),ENV,successfulExternalFetch(calls));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{ok:true,issueUrl:'https://github.com/hound83/pizza-dough-calculator/issues/42',issueNumber:42});
  assert.equal(calls.length,2);

  const turnstile=calls[0];
  assert.match(turnstile.url,/turnstile\/v0\/siteverify$/);
  assert.equal(turnstile.options.body.get('secret'),ENV.TURNSTILE_SECRET_KEY);
  assert.equal(turnstile.options.body.get('response'),'valid-turnstile-token');

  const github=calls[1];
  assert.equal(github.url,'https://api.github.com/repos/hound83/pizza-dough-calculator/issues');
  assert.equal(github.options.headers.Authorization,`Bearer ${ENV.GITHUB_TOKEN}`);
  const issue=JSON.parse(github.options.body);
  assert.match(issue.title,/^\[Feedback: Bug\] Picker mentions @\u200boctocat$/u);
  assert.match(issue.body,/"appVersion": "1\.3\.0"/);
  assert.match(issue.body,/"viewport": "320x568"/);
  assert.doesNotMatch(issue.body,/hydration|localStorage|userAgent|valid-turnstile-token|github-secret-token/);
});

test('diagnostic and issue-body helpers only retain approved non-recipe context',()=>{
  const diagnostics=sanitizeDiagnostics({
    appVersion:'1.3.0',language:'nl',experienceMode:'full',outputMode:'dough',wizardPage:1,viewport:'1280x900',
    recipe:{hydration:63},bakeLog:['private'],email:'person@example.com'
  });
  assert.deepEqual(diagnostics,{appVersion:'1.3.0',language:'nl',experienceMode:'full',outputMode:'dough',wizardPage:1,viewport:'1280x900'});
  const validated=validatePayload(validPayload({diagnostics}));
  assert.equal(validated.error,undefined);
  const markdown=issueBody(validated.payload);
  assert.doesNotMatch(markdown,/hydration|bakeLog|person@example\.com/);
});

test('user Markdown is contained in an adaptive text fence',()=>{
  const input='![tracking](https://attacker.example/p.png)\n[click](https://phishing.example)\n<img src=x onerror=1>\n````nested````\n@octocat';
  const fenced=fenceMarkdown(input);
  const lines=fenced.split('\n');
  const opening=lines.shift(),closing=lines.pop();
  const delimiter=opening.slice(0,-4);
  assert.match(opening,/^`{3,}text$/);
  assert.equal(closing,delimiter);
  assert(delimiter.length>Math.max(...[...lines.join('\n').matchAll(/`+/g)].map(match=>match[0].length),0));
  assert.equal(lines.join('\n'),input.replace('@','@\u200b'));
  const validated=validatePayload(validPayload({message:input,steps:'',diagnostics:null}));
  const body=issueBody(validated.payload);
  assert.match(body,/Submitted anonymously through the pizza calculator feedback form\./);
  assert.doesNotMatch(body,/v1\.2 feedback form/);
  assert(body.includes(fenced));
});

test('Unicode format controls are removed from public feedback fields',()=>{
  const validated=validatePayload(validPayload({summary:'safe\u202Etitle here',message:'Clear\u2066 message content'}));
  assert.equal(validated.error,undefined);
  assert.equal(validated.payload.summary,'safetitle here');
  assert.equal(validated.payload.message,'Clear message content');
});

test('recognizable literal email addresses are rejected before external services are called',async()=>{
  let calls=0;
  for(const email of ['person@example.com','person＠example.com']){
    const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload({message:`Please contact me at ${email} about this bug.`})}),ENV,async()=>{calls++;throw new Error('must not run')});
    assert.equal(response.status,400,email);
    assert.deepEqual(await response.json(),{ok:false,code:'personal_data'},email);
  }
  assert.equal(calls,0);
});

test('invalid, oversized, and non-JSON submissions fail before Turnstile',async()=>{
  let calls=0;
  const fetchImpl=async()=>{calls++;throw new Error('must not run')};
  const invalid=await handleRequest(request('/feedback',{method:'POST',body:validPayload({category:'other'})}),ENV,fetchImpl);
  assert.equal(invalid.status,400);
  const malformed=await handleRequest(request('/feedback',{method:'POST',body:'{broken'}),ENV,fetchImpl);
  assert.equal(malformed.status,400);
  const wrongType=await handleRequest(request('/feedback',{method:'POST',body:'hello',contentType:'text/plain'}),ENV,fetchImpl);
  assert.equal(wrongType.status,415);
  const oversized=await handleRequest(request('/feedback',{method:'POST',body:JSON.stringify(validPayload({message:'x'.repeat(17_000)}))}),ENV,fetchImpl);
  assert.equal(oversized.status,400);
  assert.equal(calls,0);
});

test('honeypot submissions return a quiet success without Turnstile or GitHub',async()=>{
  let calls=0;
  const response=await handleRequest(request('/feedback',{method:'POST',body:{website:'https://spam.example'}}),ENV,async()=>{calls++;throw new Error('must not run')});
  assert.equal(response.status,202);
  assert.deepEqual(await response.json(),{ok:true});
  assert.equal(calls,0);
});

test('Turnstile action or hostname mismatch prevents GitHub writes',async()=>{
  for(const result of [
    {success:false,action:'pizza_feedback',hostname:'hound83.github.io'},
    {success:true,action:'wrong_action',hostname:'hound83.github.io'},
    {success:true,action:'pizza_feedback',hostname:'evil.example'}
  ]){
    let calls=0;
    const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload()}),ENV,async url=>{
      calls++;
      assert.match(String(url),/siteverify$/);
      return Response.json(result);
    });
    assert.equal(response.status,400);
    assert.deepEqual(await response.json(),{ok:false,code:'captcha_failed'});
    assert.equal(calls,1);
  }
});

test('local dummy-key action can be explicit without weakening production action',async()=>{
  const env={...ENV,TURNSTILE_EXPECTED_ACTION:'test',TURNSTILE_EXPECTED_HOSTNAME:'localhost'};
  const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload()}),env,async url=>{
    if(String(url).includes('/siteverify'))return Response.json({success:true,action:'test',hostname:'localhost'});
    return Response.json({number:7,html_url:'https://github.com/hound83/pizza-dough-calculator/issues/7'},{status:201});
  });
  assert.equal(response.status,201);
  assert.equal((await response.json()).issueNumber,7);
  assert.equal(ENV.TURNSTILE_EXPECTED_ACTION,'pizza_feedback');
});

test('GitHub failures return a safe generic error without leaking credentials',async()=>{
  const response=await handleRequest(request('/feedback',{method:'POST',body:validPayload()}),ENV,async url=>{
    if(String(url).includes('/siteverify'))return Response.json({success:true,action:'pizza_feedback',hostname:'hound83.github.io'});
    return Response.json({message:'token github-secret-token rejected'},{status:401});
  });
  assert.equal(response.status,502);
  const text=await response.text();
  assert.equal(text,JSON.stringify({ok:false,code:'service_unavailable'}));
  assert.doesNotMatch(text,/github-secret-token|turnstile-secret-token|token rejected/);
});
