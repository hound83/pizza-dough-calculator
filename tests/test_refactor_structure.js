'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=path.resolve(__dirname,'..');
const GOLDEN={
  singleFile:'7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f',
  css:'262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896',
  javascript:'2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7'
};
const EXPECTED_SCRIPTS=[
  'assets/js/foundation.js',
  'assets/js/translations.js',
  'assets/js/i18n.js',
  'assets/js/catalog.js',
  'assets/js/pizza-picker.js',
  'assets/js/dough-fermentation.js',
  'assets/js/sauce-recipes.js',
  'assets/js/fermentation-live.js',
  'assets/js/planning-shopping.js',
  'assets/js/navigation-logbook.js',
  'assets/js/persistence-bootstrap.js'
];
const STYLE_LINK='<link href="assets/css/app.css" rel="stylesheet"/>';
const SCRIPT_TAGS=EXPECTED_SCRIPTS.map(src=>`<script src="${src}"></script>`).join('\n');

function sha256(content){return crypto.createHash('sha256').update(content,'utf8').digest('hex');}
function assert(condition,message){if(!condition)throw new Error(message);}
function pass(message){console.log(`PASS ${message}`);}

const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'assets','css','app.css'),'utf8');
const scripts=[...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi)].map(match=>match[1]);
assert(JSON.stringify(scripts)===JSON.stringify(EXPECTED_SCRIPTS),`Unexpected script order: ${scripts.join(', ')}`);
pass('root HTML loads the eleven responsibility-based scripts in the documented order');

assert(!/<style(?:\s[^>]*)?>/i.test(html),'Root HTML contains an inline stylesheet.');
assert(!/<script(?![^>]*\bsrc\s*=)(?:\s[^>]*)?>/i.test(html),'Root HTML contains inline JavaScript.');
assert(html.includes(STYLE_LINK),'Root HTML does not reference assets/css/app.css.');
pass('root HTML contains no inline CSS or JavaScript');

const moduleSources=EXPECTED_SCRIPTS.map(src=>fs.readFileSync(path.join(ROOT,src),'utf8'));
const combinedJavaScript=moduleSources.join('');
assert(!html.includes('assets/js/app.js')&&!fs.existsSync(path.join(ROOT,'assets','js','app.js')),'Legacy app.js is still part of the root refactor.');
pass('the legacy all-in-one app.js is absent from the root refactor');

assert(sha256(css)===GOLDEN.css,`CSS differs from v1.0.0: ${sha256(css)}`);
assert(sha256(combinedJavaScript)===GOLDEN.javascript,`Combined JavaScript differs from v1.0.0: ${sha256(combinedJavaScript)}`);
pass('CSS and recombined JavaScript are byte-for-byte equal to v1.0.0');

new vm.Script(combinedJavaScript,{filename:'combined-refactor.js'});
pass('recombined JavaScript parses successfully');

const reconstructed=html
  .replace(STYLE_LINK,`<style>${css}</style>`)
  .replace(SCRIPT_TAGS,`<script>${combinedJavaScript}</script>`);
assert(sha256(reconstructed)===GOLDEN.singleFile,`Reconstructed single-file hash differs from v1.0.0: ${sha256(reconstructed)}`);
pass('the complete refactor reconstructs the golden single file exactly');

const contracts=[
  ['foundation.js','const APP_VERSION'],
  ['translations.js','const EN_TEXT'],
  ['i18n.js','function setLanguage'],
  ['catalog.js','const pizzaRecipes'],
  ['pizza-picker.js','function renderPickerPreview'],
  ['dough-fermentation.js','function yeastRecommendation'],
  ['sauce-recipes.js','function aggregateSauceNeeds'],
  ['fermentation-live.js','function liveFermentationPlan'],
  ['planning-shopping.js','function buildTimeline'],
  ['navigation-logbook.js','function renderBakeLog'],
  ['persistence-bootstrap.js','const SAVE_KEY']
];
for(const [file,needle] of contracts){
  const source=fs.readFileSync(path.join(ROOT,'assets','js',file),'utf8');
  assert(source.includes(needle),`${file} is missing its responsibility marker ${needle}.`);
}
pass('each JavaScript file contains its intended responsibility marker');

const owners=new Map(EXPECTED_SCRIPTS.map((src,index)=>[path.basename(src),moduleSources[index]]));
for(const [contract,expectedOwner] of [['DOMContentLoaded','persistence-bootstrap.js'],['const SAVE_KEY','persistence-bootstrap.js']]){
  const actual=[...owners].filter(([,source])=>source.includes(contract)).map(([file])=>file);
  assert(actual.length===1&&actual[0]===expectedOwner,`${contract} ownership is ${actual.join(', ')||'missing'}, expected ${expectedOwner}.`);
}
pass('bootstrap and persistence contracts have one explicit owner');

const staticHtml=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const ids=[...staticHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map(match=>match[1]);
const duplicateIds=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
assert(duplicateIds.length===0,`Duplicate static ids: ${duplicateIds.join(', ')}`);
const handlers=[...staticHtml.matchAll(/\bon[a-z]+=["']([^"']+)["']/gi)].map(match=>match[1]);
const called=handlers.flatMap(handler=>[...handler.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(match=>match[1]));
const declared=new Set([...combinedJavaScript.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match=>match[1]));
const browserFunctions=new Set(['confirm','getElementById','print']);
const missing=[...new Set(called.filter(name=>!declared.has(name)&&!browserFunctions.has(name)))];
assert(missing.length===0,`Inline handlers reference missing functions: ${missing.join(', ')}`);
pass(`${ids.length} static ids are unique and all ${handlers.length} inline handlers resolve`);

console.log('\n9 refactor-structure tests passed');
