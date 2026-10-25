'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');

const PROJECT_ROOT=path.resolve(__dirname,'..');
const SOURCE_ROOT=path.join(PROJECT_ROOT,'src');
const OUTPUT_PATH=path.join(PROJECT_ROOT,'index.html');
const STYLE_LINK='<link href="assets/css/app.css" rel="stylesheet"/>';
const SITE_STYLE_LINK='<link href="src/assets/css/app.css" rel="stylesheet"/>';
const EXPECTED_SCRIPTS=[
  'assets/js/calculation-core.js',
  'assets/js/workflow-core.js',
  'assets/js/evening-core.js',
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
  'assets/js/batch-workflow.js',
  'assets/js/workshop-tools.js',
  'assets/js/evening-workflow.js',
  'assets/js/evening-planning.js',
  'assets/js/persistence-bootstrap.js'
];
const SCRIPT_TAGS=EXPECTED_SCRIPTS.map(src=>`<script src="${src}"></script>`).join('\n');
const SITE_SCRIPT_TAGS=EXPECTED_SCRIPTS.map(src=>`<script src="src/${src}"></script>`).join('\n');

function sha256(content){
  return crypto.createHash('sha256').update(content,'utf8').digest('hex');
}

function readBundleInputs(sourceRoot=SOURCE_ROOT){
  const html=fs.readFileSync(path.join(sourceRoot,'index.html'),'utf8');
  const css=fs.readFileSync(path.join(sourceRoot,'assets','css','app.css'),'utf8');
  const modules=EXPECTED_SCRIPTS.map(src=>fs.readFileSync(path.join(sourceRoot,src),'utf8'));
  if(!html.includes(STYLE_LINK))throw new Error(`Source HTML is missing ${STYLE_LINK}`);
  if(!html.includes(SCRIPT_TAGS))throw new Error('Source HTML does not contain the expected script sequence.');
  return {html,css,modules};
}

function buildBundle(sourceRoot=SOURCE_ROOT){
  const source=readBundleInputs(sourceRoot);
  const javascript=source.modules.join('');
  const html=source.html
    .replace(STYLE_LINK,`<style>${source.css}</style>`)
    .replace(SCRIPT_TAGS,`<script>${javascript}</script>`);
  return {html,css:source.css,javascript};
}

// GitHub Pages serves a small entry document and requests the maintained assets.
// buildBundle remains available only to verify immutable historical release hashes.
function buildSite(sourceRoot=SOURCE_ROOT){
  const source=readBundleInputs(sourceRoot);
  const html=source.html
    .replace(STYLE_LINK,SITE_STYLE_LINK)
    .replace(SCRIPT_TAGS,SITE_SCRIPT_TAGS);
  return {html,css:source.css,javascript:source.modules.join('')};
}

function writeOrCheck({sourceRoot=SOURCE_ROOT,outputPath=OUTPUT_PATH,checkOnly=false}={}){
  const bundle=buildSite(sourceRoot);
  if(checkOnly){
    if(!fs.existsSync(outputPath))throw new Error(`Missing generated website entry: ${outputPath}`);
    const current=fs.readFileSync(outputPath,'utf8');
    if(current!==bundle.html)throw new Error(`Generated website entry is stale: ${outputPath}`);
  }else{
    fs.writeFileSync(outputPath,bundle.html,'utf8');
  }
  return {
    mode:checkOnly?'check':'write',
    source:path.resolve(sourceRoot),
    output:path.resolve(outputPath),
    bytes:Buffer.byteLength(bundle.html),
    sha256:sha256(bundle.html),
    cssSha256:sha256(bundle.css),
    javascriptSha256:sha256(bundle.javascript)
  };
}

if(require.main===module){
  try{
    const report=writeOrCheck({checkOnly:process.argv.includes('--check')});
    console.log(JSON.stringify(report,null,2));
  }catch(error){
    console.error(error.message);
    process.exitCode=1;
  }
}

module.exports={
  EXPECTED_SCRIPTS,
  OUTPUT_PATH,
  PROJECT_ROOT,
  SCRIPT_TAGS,
  SITE_SCRIPT_TAGS,
  SITE_STYLE_LINK,
  SOURCE_ROOT,
  STYLE_LINK,
  buildBundle,
  buildSite,
  readBundleInputs,
  sha256,
  writeOrCheck
};
