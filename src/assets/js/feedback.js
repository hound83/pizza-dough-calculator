const FEEDBACK_CONFIG_META='pizza-feedback-api';
const FEEDBACK_LIVE_URL='https://hound83.github.io/pizza-dough-calculator/';
const FEEDBACK_TURNSTILE_SCRIPT='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const FEEDBACK_ACTION='pizza_feedback';
const FEEDBACK_PERSISTENT_FAILURES=new Set(['serviceError','rateLimited','privacyRejected','rejected']);

const FEEDBACK_COPY={
  checking:['Feedbackservice controleren…','Checking the feedback service…'],
  ready:['Bevestig hieronder dat je geen bot bent. Daarna kun je je feedback versturen.','Confirm below that you are not a bot. You can then send your feedback.'],
  offline:['Je bent offline. De calculator blijft volledig werken, maar feedback versturen vereist internet.','You are offline. The calculator remains fully usable, but sending feedback requires an internet connection.'],
  fileProtocol:['De gedownloade calculator blijft offline werken. Open de live calculator om feedback te versturen.','The downloaded calculator keeps working offline. Open the live calculator to send feedback.'],
  unconfigured:['De feedbackservice is nog niet geconfigureerd. Er is niets verstuurd.','The feedback service has not yet been configured. Nothing was sent.'],
  serviceError:['De feedbackservice is nu niet bereikbaar. Je tekst blijft staan; probeer het later opnieuw.','The feedback service is currently unavailable. Your text is preserved; please try again later.'],
  captchaError:['De beveiligingscontrole lukte niet. Probeer de controle opnieuw.','The security check failed. Please try the check again.'],
  captchaExpired:['De beveiligingscontrole is verlopen. Bevestig opnieuw dat je geen bot bent.','The security check expired. Please confirm again that you are not a bot.'],
  invalid:['Vul het soort feedback, een korte samenvatting en een duidelijke beschrijving in.','Enter the feedback type, a short summary, and a clear description.'],
  sending:['Feedback wordt veilig verstuurd…','Sending feedback securely…'],
  success:['Bedankt! Je feedback is als GitHub-issue opgeslagen.','Thank you! Your feedback was saved as a GitHub issue.'],
  rateLimited:['Er zijn kort na elkaar te veel berichten verstuurd. Wacht even en probeer het daarna opnieuw.','Too many messages were sent in a short period. Wait a moment and try again.'],
  privacyRejected:['Verwijder e-mailadressen of andere contactgegevens; je feedback wordt openbaar opgeslagen.','Remove email addresses or other contact details; your feedback is stored publicly.'],
  rejected:['De feedback kon niet worden opgeslagen. Controleer je tekst en probeer het opnieuw.','The feedback could not be saved. Check your text and try again.'],
  send:['Feedback versturen','Send feedback'],
  sendingButton:['Bezig met versturen…','Sending…'],
  issueLink:['Bekijk je feedback op GitHub','View your feedback on GitHub'],
  liveLink:['Open de live calculator om feedback te versturen','Open the live calculator to send feedback'],
  button:['Feedback','Feedback']
};

let _feedbackPreviousFocus=null;
let _feedbackConfig=null;
let _feedbackConfigPromise=null;
let _feedbackTurnstilePromise=null;
let _feedbackTurnstileWidget=null;
let _feedbackTurnstileToken='';
let _feedbackStatusKey='';
let _feedbackSubmitting=false;
let _feedbackSucceeded=false;
let _feedbackBackgroundState=[];

function feedbackText(key){
  const pair=FEEDBACK_COPY[key]||['',''];
  return currentLang==='en'?pair[1]:pair[0];
}

function feedbackApiBase(){
  const configured=String(window.PIZZA_FEEDBACK_API_URL||document.querySelector(`meta[name="${FEEDBACK_CONFIG_META}"]`)?.content||'').trim();
  if(!configured)return '';
  try{
    const url=new URL(configured,window.location?.href||FEEDBACK_LIVE_URL);
    const localHttp=url.protocol==='http:'&&(url.hostname==='127.0.0.1'||url.hostname==='localhost');
    if((url.protocol!=='https:'&&!localHttp)||url.username||url.password)return '';
    url.hash='';url.search='';
    return url.href.replace(/\/$/,'');
  }catch(error){return ''}
}

function setFeedbackStatus(key,tone=''){
  _feedbackStatusKey=key;
  const status=$('feedbackStatus');
  if(!status)return;
  status.className=`feedback-status${tone?` ${tone}`:''}`;
  status.textContent=feedbackText(key);
}

function setFeedbackSendEnabled(enabled){
  const button=$('feedbackSendButton');
  if(!button)return;
  button.disabled=!enabled||_feedbackSubmitting;
  button.textContent=feedbackText(_feedbackSubmitting?'sendingButton':'send');
}

function feedbackModalOpen(){const modal=$('feedbackModal');return Boolean(modal&&!modal.classList.contains('hidden'));}

function refreshFeedbackLanguage(){
  if($('feedbackButtonLabel'))$('feedbackButtonLabel').textContent=feedbackText('button');
  if($('feedbackSendButton'))$('feedbackSendButton').textContent=feedbackText(_feedbackSubmitting?'sendingButton':'send');
  if($('feedbackIssueLink'))$('feedbackIssueLink').textContent=feedbackText('issueLink');
  if($('feedbackLiveLink'))$('feedbackLiveLink').textContent=feedbackText('liveLink');
  if(_feedbackStatusKey)setFeedbackStatus(_feedbackStatusKey,$('feedbackStatus')?.classList.contains('good')?'good':$('feedbackStatus')?.classList.contains('warn')?'warn':$('feedbackStatus')?.classList.contains('bad')?'bad':'');
  if(feedbackModalOpen()&&_feedbackConfig&&window.turnstile?.render)renderFeedbackTurnstile();
}

function feedbackSafeIssueUrl(value){
  try{
    const url=new URL(String(value));
    return url.protocol==='https:'&&url.hostname==='github.com'&&/\/issues\/\d+$/.test(url.pathname)?url.href:'';
  }catch(error){return ''}
}

function feedbackDiagnostics(){
  return {
    appVersion:APP_VERSION,
    language:currentLang,
    experienceMode,
    outputMode:appMode,
    wizardPage:Number(currentWizardPage)||0,
    viewport:`${Number(window.innerWidth)||0}x${Number(window.innerHeight)||0}`
  };
}

function buildFeedbackPayload(){
  const payload={
    category:String($('feedbackCategory')?.value||'').trim(),
    summary:String($('feedbackSummary')?.value||'').trim(),
    message:String($('feedbackMessage')?.value||'').trim(),
    steps:String($('feedbackSteps')?.value||'').trim(),
    website:String($('feedbackWebsite')?.value||'').trim(),
    language:currentLang==='en'?'en':'nl',
    turnstileToken:_feedbackTurnstileToken
  };
  if($('feedbackIncludeDiagnostics')?.checked)payload.diagnostics=feedbackDiagnostics();
  return payload;
}

function feedbackPayloadLooksValid(payload){
  return ['bug','idea','calculation','translation'].includes(payload.category)
    &&payload.summary.length>=3&&payload.summary.length<=120
    &&payload.message.length>=10&&payload.message.length<=4000
    &&payload.steps.length<=1500;
}

async function feedbackFetch(path,options={}){
  const base=feedbackApiBase();
  if(!base)throw new Error('feedback_unconfigured');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(`${base}${path}`,{
      cache:'no-store',
      credentials:'omit',
      referrerPolicy:'no-referrer',
      ...options,
      signal:controller.signal
    });
    let data={};
    try{data=await response.json();}catch(error){}
    return {response,data};
  }finally{clearTimeout(timeout)}
}

function ensureFeedbackTurnstile(){
  if(window.turnstile?.render)return Promise.resolve(window.turnstile);
  if(_feedbackTurnstilePromise)return _feedbackTurnstilePromise;
  _feedbackTurnstilePromise=new Promise((resolve,reject)=>{
    const existing=document.getElementById('feedbackTurnstileScript');
    const script=existing||document.createElement('script');
    const fail=error=>{
      clearTimeout(timer);
      if(!existing)script.remove();
      reject(error);
    };
    const timer=setTimeout(()=>fail(new Error('turnstile_timeout')),10000);
    const finish=()=>{
      clearTimeout(timer);
      if(window.turnstile?.render)resolve(window.turnstile);else fail(new Error('turnstile_missing'));
    };
    script.addEventListener('load',finish,{once:true});
    script.addEventListener('error',()=>fail(new Error('turnstile_load_failed')),{once:true});
    if(!existing){
      script.id='feedbackTurnstileScript';
      script.src=FEEDBACK_TURNSTILE_SCRIPT;
      script.async=true;
      script.defer=true;
      document.head.appendChild(script);
    }
  }).catch(error=>{_feedbackTurnstilePromise=null;throw error;});
  return _feedbackTurnstilePromise;
}

function clearFeedbackTurnstile(){
  _feedbackTurnstileToken='';
  if(_feedbackTurnstileWidget!=null&&window.turnstile?.remove){
    try{window.turnstile.remove(_feedbackTurnstileWidget);}catch(error){}
  }
  _feedbackTurnstileWidget=null;
  const container=$('feedbackTurnstile');
  if(container)container.replaceChildren();
}

function renderFeedbackTurnstile(){
  const container=$('feedbackTurnstile');
  if(!container||!_feedbackConfig?.siteKey||!window.turnstile?.render)return;
  clearFeedbackTurnstile();
  _feedbackTurnstileWidget=window.turnstile.render(container,{
    sitekey:_feedbackConfig.siteKey,
    action:FEEDBACK_ACTION,
    theme:'dark',
    size:window.innerWidth<380?'compact':'flexible',
    language:currentLang==='en'?'en':'nl',
    callback:token=>{
      _feedbackTurnstileToken=String(token||'');
      if(!FEEDBACK_PERSISTENT_FAILURES.has(_feedbackStatusKey))setFeedbackStatus('ready','good');
      setFeedbackSendEnabled(Boolean(_feedbackTurnstileToken));
    },
    'expired-callback':()=>{
      _feedbackTurnstileToken='';
      setFeedbackStatus('captchaExpired','warn');
      setFeedbackSendEnabled(false);
    },
    'error-callback':()=>{
      _feedbackTurnstileToken='';
      setFeedbackStatus('captchaError','bad');
      setFeedbackSendEnabled(false);
    }
  });
}

function resetFeedbackChallenge(){
  _feedbackTurnstileToken='';
  setFeedbackSendEnabled(false);
  if(_feedbackTurnstileWidget!=null&&window.turnstile?.reset){
    try{window.turnstile.reset(_feedbackTurnstileWidget);return;}catch(error){}
  }
  if(_feedbackConfig)renderFeedbackTurnstile();
}

async function prepareFeedbackService(){
  const protocol=window.location?.protocol||'';
  $('feedbackLiveLink')?.classList.add('hidden');
  $('feedbackIssueLink')?.classList.add('hidden');
  setFeedbackSendEnabled(false);
  if(protocol==='file:'){
    setFeedbackStatus('fileProtocol','warn');
    $('feedbackLiveLink')?.classList.remove('hidden');
    return;
  }
  if(navigator.onLine===false){setFeedbackStatus('offline','warn');return;}
  if(!feedbackApiBase()){setFeedbackStatus('unconfigured','warn');return;}
  if(_feedbackConfig){
    try{await ensureFeedbackTurnstile();renderFeedbackTurnstile();setFeedbackStatus('ready');}
    catch(error){setFeedbackStatus('serviceError','bad');}
    return;
  }
  setFeedbackStatus('checking');
  if(!_feedbackConfigPromise){
    _feedbackConfigPromise=feedbackFetch('/config').then(({response,data})=>{
      if(!response.ok||data?.enabled!==true||typeof data.siteKey!=='string'||!data.siteKey.trim())throw new Error('feedback_config_unavailable');
      _feedbackConfig={siteKey:data.siteKey.trim()};
      return _feedbackConfig;
    }).catch(error=>{_feedbackConfigPromise=null;throw error;});
  }
  try{
    await _feedbackConfigPromise;
    await ensureFeedbackTurnstile();
    renderFeedbackTurnstile();
    setFeedbackStatus('ready');
  }catch(error){setFeedbackStatus('serviceError','bad');}
}

function resetFeedbackForm(){
  $('feedbackForm')?.reset();
  if($('feedbackForm'))[...$('feedbackForm').elements].forEach(element=>{element.disabled=false;});
  $('feedbackIssueLink')?.classList.add('hidden');
  $('feedbackLiveLink')?.classList.add('hidden');
  _feedbackSucceeded=false;
  _feedbackSubmitting=false;
  _feedbackTurnstileToken='';
  setFeedbackSendEnabled(false);
}

function openFeedback(){
  const modal=$('feedbackModal');
  if(!modal)return;
  if(feedbackModalOpen())return;
  if(_feedbackSucceeded)resetFeedbackForm();
  _feedbackPreviousFocus=document.activeElement;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('feedback-open');
  _feedbackBackgroundState=[...document.body.children]
    .filter(element=>element!==modal&&element.tagName!=='SCRIPT')
    .map(element=>({element,inert:element.inert,ariaHidden:element.getAttribute('aria-hidden')}));
  _feedbackBackgroundState.forEach(({element})=>{element.inert=true;element.setAttribute('aria-hidden','true');});
  refreshFeedbackLanguage();
  $('feedbackPanel')?.focus();
  prepareFeedbackService();
}

function closeFeedback(){
  const modal=$('feedbackModal');
  if(!modal)return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('feedback-open');
  _feedbackBackgroundState.forEach(({element,inert,ariaHidden})=>{
    element.inert=inert;
    if(ariaHidden==null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',ariaHidden);
  });
  _feedbackBackgroundState=[];
  if(_feedbackPreviousFocus?.focus)_feedbackPreviousFocus.focus();
}

function feedbackFocusableElements(){
  const panel=$('feedbackPanel');
  if(!panel)return [];
  return [...panel.querySelectorAll('button:not([disabled]),a[href]:not(.hidden),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element=>!element.closest('.hidden'));
}

function handleFeedbackKeydown(event){
  if(!feedbackModalOpen())return;
  if(event.key==='Escape'){event.preventDefault();closeFeedback();return;}
  if(event.key!=='Tab')return;
  const focusable=feedbackFocusableElements();
  if(!focusable.length){event.preventDefault();$('feedbackPanel')?.focus();return;}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

async function submitFeedback(event){
  event.preventDefault();
  if(_feedbackSubmitting)return;
  const form=$('feedbackForm');
  const payload=buildFeedbackPayload();
  if(!form?.checkValidity()||!feedbackPayloadLooksValid(payload)){
    setFeedbackStatus('invalid','warn');
    form?.reportValidity();
    return;
  }
  if(!_feedbackTurnstileToken){setFeedbackStatus('captchaError','warn');return;}
  _feedbackSubmitting=true;
  setFeedbackSendEnabled(false);
  setFeedbackStatus('sending');
  try{
    const {response,data}=await feedbackFetch('/feedback',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!response.ok||data?.ok!==true){
      if(response.status===429||data?.code==='rate_limited')setFeedbackStatus('rateLimited','warn');
      else if(data?.code==='personal_data')setFeedbackStatus('privacyRejected','warn');
      else if(data?.code==='invalid_request')setFeedbackStatus('rejected','warn');
      else if(data?.code==='captcha_failed')setFeedbackStatus('captchaError','warn');
      else setFeedbackStatus('serviceError','bad');
      resetFeedbackChallenge();
      return;
    }
    const issueUrl=feedbackSafeIssueUrl(data.issueUrl);
    const issueLink=$('feedbackIssueLink');
    if(issueUrl&&issueLink){issueLink.href=issueUrl;issueLink.classList.remove('hidden');}
    setFeedbackStatus('success','good');
    _feedbackSucceeded=true;
    clearFeedbackTurnstile();
    [...form.elements].forEach(element=>{if(element.id!=='feedbackCancelButton')element.disabled=true;});
  }catch(error){
    setFeedbackStatus(navigator.onLine===false?'offline':'serviceError',navigator.onLine===false?'warn':'bad');
    resetFeedbackChallenge();
  }finally{
    _feedbackSubmitting=false;
    setFeedbackSendEnabled(false);
  }
}

function initFeedback(){
  const button=$('feedbackButton'),modal=$('feedbackModal'),form=$('feedbackForm');
  if(!button||!modal||!form)return;
  button.addEventListener('click',openFeedback);
  $('feedbackCloseButton')?.addEventListener('click',closeFeedback);
  $('feedbackCancelButton')?.addEventListener('click',closeFeedback);
  modal.addEventListener('click',event=>{if(event.target===modal)closeFeedback();});
  form.addEventListener('submit',submitFeedback);
  document.addEventListener('keydown',handleFeedbackKeydown);
  window.addEventListener('online',()=>{if(feedbackModalOpen())prepareFeedbackService();});
  window.addEventListener('offline',()=>{if(feedbackModalOpen()){setFeedbackStatus('offline','warn');setFeedbackSendEnabled(false);}});
  refreshFeedbackLanguage();
}
