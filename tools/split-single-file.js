'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');

const STYLE_LINK='<link href="assets/css/app.css" rel="stylesheet"/>';
const SCRIPT_LINK='<script src="assets/js/app.js"></script>';

function sha256(content){
  return crypto.createHash('sha256').update(content,'utf8').digest('hex');
}

function onlyMatch(source,pattern,label){
  const matches=[...source.matchAll(pattern)];
  if(matches.length!==1){
    throw new Error(`Expected exactly one ${label}; found ${matches.length}.`);
  }
  return matches[0];
}

function buildSplit(source){
  const style=onlyMatch(source,/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi,'inline <style> block');
  const script=onlyMatch(source,/<script(?![^>]*\bsrc\s*=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi,'inline <script> block');
  const html=source
    .replace(style[0],STYLE_LINK)
    .replace(script[0],SCRIPT_LINK);

  return {html,css:style[1],js:script[1]};
}

function expectedFiles(source){
  const split=buildSplit(source);
  return new Map([
    ['index.html',split.html],
    [path.join('assets','css','app.css'),split.css],
    [path.join('assets','js','app.js'),split.js]
  ]);
}

function writeOrCheck(sourcePath,outputDir,checkOnly=false){
  const source=fs.readFileSync(sourcePath,'utf8');
  const files=expectedFiles(source);
  const report=[];

  for(const [relativePath,content] of files){
    const destination=path.join(outputDir,relativePath);
    if(checkOnly){
      if(!fs.existsSync(destination))throw new Error(`Missing generated file: ${destination}`);
      const actual=fs.readFileSync(destination,'utf8');
      if(actual!==content)throw new Error(`Generated file is stale: ${destination}`);
    }else{
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.writeFileSync(destination,content,'utf8');
    }
    report.push({file:relativePath,bytes:Buffer.byteLength(content),sha256:sha256(content)});
  }

  return {
    mode:checkOnly?'check':'write',
    source:path.resolve(sourcePath),
    sourceSha256:sha256(source),
    output:path.resolve(outputDir),
    files:report
  };
}

if(require.main===module){
  const args=process.argv.slice(2);
  const checkOnly=args.includes('--check');
  const positional=args.filter(arg=>arg!=='--check');
  const sourcePath=path.resolve(positional[0]||'index.html');
  const outputDir=path.resolve(positional[1]||'split-preview');
  try{
    console.log(JSON.stringify(writeOrCheck(sourcePath,outputDir,checkOnly),null,2));
  }catch(error){
    console.error(error.message);
    process.exitCode=1;
  }
}

module.exports={STYLE_LINK,SCRIPT_LINK,buildSplit,expectedFiles,sha256,writeOrCheck};
