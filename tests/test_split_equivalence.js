'use strict';

const fs=require('fs');
const path=require('path');
const {STYLE_LINK,SCRIPT_LINK,buildSplit}=require('../tools/split-single-file');

function existingPath(candidates,label){
  const found=candidates.find(candidate=>candidate&&fs.existsSync(candidate));
  if(!found)throw new Error(`Could not find ${label}.`);
  return found;
}

const requestedSource=process.argv[2]?path.resolve(process.cwd(),process.argv[2]):null;
const requestedPreview=process.argv[3]?path.resolve(process.cwd(),process.argv[3]):null;
const projectRoot=path.resolve(__dirname,'..');
const sourcePath=existingPath([
  requestedSource,
  path.join(projectRoot,'index.html'),
  path.join(projectRoot,'pizzadeeg_calculator_v50.html')
],'the monolithic calculator');
const previewRoot=existingPath([
  requestedPreview,
  path.join(projectRoot,'split-preview')
],'the generated split preview');

const source=fs.readFileSync(sourcePath,'utf8');
const expected=buildSplit(source);
const actual={
  html:fs.readFileSync(path.join(previewRoot,'index.html'),'utf8'),
  css:fs.readFileSync(path.join(previewRoot,'assets','css','app.css'),'utf8'),
  js:fs.readFileSync(path.join(previewRoot,'assets','js','app.js'),'utf8')
};

function assert(condition,message){
  if(!condition)throw new Error(message);
}

assert(actual.html===expected.html,'Generated index.html differs from the deterministic split.');
assert(actual.css===expected.css,'Generated app.css differs from the inline stylesheet.');
assert(actual.js===expected.js,'Generated app.js differs from the inline script.');
assert(actual.html.includes(STYLE_LINK),'Generated HTML does not reference app.css.');
assert(actual.html.includes(SCRIPT_LINK),'Generated HTML does not reference app.js.');
assert(!/<style(?:\s[^>]*)?>/i.test(actual.html),'Generated HTML still contains an inline stylesheet.');
assert(!/<script(?![^>]*\bsrc\s*=)(?:\s[^>]*)?>/i.test(actual.html),'Generated HTML still contains an inline script.');

const recombined=actual.html
  .replace(STYLE_LINK,`<style>${actual.css}</style>`)
  .replace(SCRIPT_LINK,`<script>${actual.js}</script>`);
assert(recombined===source,'Splitting and recombining is not byte-for-byte lossless.');

console.log('PASS split output is deterministic and byte-for-byte reversible');
console.log('PASS generated HTML references external CSS and JavaScript only');
console.log('\n2 split-structure tests passed');
