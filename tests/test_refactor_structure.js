'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {
  EXPECTED_SCRIPTS,
  SCRIPT_TAGS,
  SOURCE_ROOT,
  STYLE_LINK,
  buildBundle,
  sha256
}=require('../tools/bundle');

const ROOT=path.resolve(__dirname,'..');
const GOLDEN={
  singleFile:'7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f',
  css:'262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896',
  javascript:'2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7'
};
const V1_1_0_RELEASE_BASELINE={
  singleFile:'68070de6d4e3fb1f6e154200d04cb4de731659fda676d27fe80f14e811946fff',
  css:'8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052',
  javascript:'37851611903633e2baa3d4d6228b74f49c6fc851405ac159735a5a4a9e800761'
};
const V1_1_1_RELEASE_BASELINE={
  singleFile:'3301a58d0fe0b26029877562b30ec4c427b328557f439e6b7649cc8003948951',
  css:'8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052',
  javascript:'db8d26918051d97d99a6e60f62da1f4970202097e4a91f1dc0e39a2c12d5a6ac'
};
const V1_2_0_RELEASE_BASELINE={
  singleFile:'54b48cf9b17af1d60e8c0ab2fe04622013c253567ed21281868f809dcc4b7c41',
  css:'8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052',
  javascript:'5de43375deece0f2689217b2d47fe1aa98ed8ac265f990e0a09a981752dd0519'
};
const V1_2_1_RELEASE_BASELINE={
  singleFile:'1dceb735571ddc2fcaf6be85c2df19b1546cd8b7f5d703f220a7b44382acd955',
  css:'7140b86b8e3d0335ea5bc6e88c37e756aabb9713de011ded629c59266cb2df19',
  javascript:'dd69b2d1be8f912e15fcb4524642d27ea27a89d29dae2c5e76f00b9f3d0d73cd'
};
function assert(condition,message){if(!condition)throw new Error(message);}
function pass(message){console.log(`PASS ${message}`);}

const sourceHtml=fs.readFileSync(path.join(SOURCE_ROOT,'index.html'),'utf8');
const bundledHtml=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const built=buildBundle(SOURCE_ROOT);
const css=built.css;
const combinedJavaScript=built.javascript;
const scripts=[...sourceHtml.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi)].map(match=>match[1]);
assert(JSON.stringify(scripts)===JSON.stringify(EXPECTED_SCRIPTS),`Unexpected script order: ${scripts.join(', ')}`);
pass('source HTML loads the eleven responsibility-based scripts in the documented order');

assert(!/<style(?:\s[^>]*)?>/i.test(sourceHtml),'Source HTML contains an inline stylesheet.');
assert(!/<script(?![^>]*\bsrc\s*=)(?:\s[^>]*)?>/i.test(sourceHtml),'Source HTML contains inline JavaScript.');
assert(sourceHtml.includes(STYLE_LINK),'Source HTML does not reference assets/css/app.css.');
pass('source HTML contains no inline CSS or JavaScript');

assert(!/<script\s+[^>]*src=/i.test(bundledHtml)&&!/<link\s+[^>]*href=["']assets\//i.test(bundledHtml),'Standalone bundle still references source assets.');
pass('root index.html is a self-contained standalone bundle');

assert(bundledHtml===built.html,'Committed standalone bundle differs from the source reconstruction.');
pass('committed standalone bundle is current');

const moduleSources=EXPECTED_SCRIPTS.map(src=>fs.readFileSync(path.join(SOURCE_ROOT,src),'utf8'));
assert(!sourceHtml.includes('assets/js/app.js')&&!fs.existsSync(path.join(SOURCE_ROOT,'assets','js','app.js')),'Legacy app.js is still part of the source refactor.');
pass('the legacy all-in-one app.js is absent from the modular source');

const guardrails=fs.readFileSync(path.join(ROOT,'docs','PRODUCT_GUARDRAILS.md'),'utf8');
for(const hash of Object.values(GOLDEN))assert(guardrails.includes(hash),`Historical v1.0.0 baseline hash is missing from product guardrails: ${hash}`);
pass('historical v1.0.0 baseline hashes remain documented');

for(const hash of Object.values(V1_1_0_RELEASE_BASELINE))assert(guardrails.includes(hash),`Released v1.1.0 baseline hash is missing from product guardrails: ${hash}`);
pass('released v1.1.0 hashes are pinned and documented');

for(const hash of Object.values(V1_1_1_RELEASE_BASELINE))assert(guardrails.includes(hash),`Released v1.1.1 baseline hash is missing from product guardrails: ${hash}`);
pass('released v1.1.1 hashes remain documented');

for(const hash of Object.values(V1_2_0_RELEASE_BASELINE))assert(guardrails.includes(hash),`Released v1.2.0 baseline hash is missing from product guardrails: ${hash}`);
assert(sha256(bundledHtml)===V1_2_1_RELEASE_BASELINE.singleFile,'Standalone v1.2.1 release baseline changed without approval.');
assert(sha256(css)===V1_2_1_RELEASE_BASELINE.css,'CSS v1.2.1 release baseline changed without approval.');
assert(sha256(combinedJavaScript)===V1_2_1_RELEASE_BASELINE.javascript,'JavaScript v1.2.1 release baseline changed without approval.');
for(const hash of Object.values(V1_2_1_RELEASE_BASELINE))assert(guardrails.includes(hash),`Released v1.2.1 baseline hash is missing from product guardrails: ${hash}`);
pass('released v1.2.0 and v1.2.1 baselines are pinned and documented');

new vm.Script(combinedJavaScript,{filename:'combined-refactor.js'});
pass('recombined JavaScript parses successfully');

const reconstructed=sourceHtml
  .replace(STYLE_LINK,`<style>${css}</style>`)
  .replace(SCRIPT_TAGS,`<script>${combinedJavaScript}</script>`);
assert(reconstructed===built.html,'Source reconstruction differs from the generated feature bundle.');
pass('the complete modular source reconstructs the current feature bundle exactly');

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
  const source=fs.readFileSync(path.join(SOURCE_ROOT,'assets','js',file),'utf8');
  assert(source.includes(needle),`${file} is missing its responsibility marker ${needle}.`);
}
pass('each JavaScript file contains its intended responsibility marker');

const owners=new Map(EXPECTED_SCRIPTS.map((src,index)=>[path.basename(src),moduleSources[index]]));
for(const [contract,expectedOwner] of [['DOMContentLoaded','persistence-bootstrap.js'],['const SAVE_KEY','persistence-bootstrap.js']]){
  const actual=[...owners].filter(([,source])=>source.includes(contract)).map(([file])=>file);
  assert(actual.length===1&&actual[0]===expectedOwner,`${contract} ownership is ${actual.join(', ')||'missing'}, expected ${expectedOwner}.`);
}
pass('bootstrap and persistence contracts have one explicit owner');

const staticHtml=sourceHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
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

const readmeEnglish=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
const readmeDutch=fs.readFileSync(path.join(ROOT,'README.nl.md'),'utf8');
const languageNavigation='[English](README.md) | [Nederlands](README.nl.md)';
const headingLevels=markdown=>[...markdown.matchAll(/^(#{1,6})\s+\S.*$/gm)].map(match=>match[1].length);
assert(readmeEnglish.includes(languageNavigation)&&readmeDutch.includes(languageNavigation),'Both README files must contain the language navigation.');
assert(JSON.stringify(headingLevels(readmeEnglish))===JSON.stringify(headingLevels(readmeDutch)),'English and Dutch README heading structures differ.');
assert(/README\.md.*canonieke/i.test(readmeDutch),'Dutch README must identify README.md as the canonical version.');
pass('English and Dutch README files retain equivalent structure and canonical-language guidance');

console.log('\n15 refactor-structure tests passed');
