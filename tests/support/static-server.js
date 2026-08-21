'use strict';

const fs=require('fs');
const http=require('http');
const path=require('path');

const HOST='127.0.0.1';
const PORT=Number(process.env.PORT)||4173;
const ROOT=path.resolve(__dirname,'../..');
const MIME_TYPES={
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.md':'text/markdown; charset=utf-8'
};

function resolveRequestPath(requestUrl){
  const pathname=decodeURIComponent(new URL(requestUrl,'http://localhost').pathname);
  const relativePath=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const filePath=path.resolve(ROOT,relativePath);
  if(filePath!==ROOT&&!filePath.startsWith(`${ROOT}${path.sep}`))return null;
  return filePath;
}

const server=http.createServer((request,response)=>{
  let filePath;
  try{
    filePath=resolveRequestPath(request.url);
  }catch(error){
    response.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'}).end('Bad request');
    return;
  }

  if(!filePath){
    response.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'}).end('Forbidden');
    return;
  }

  fs.stat(filePath,(statError,stat)=>{
    if(statError||!stat.isFile()){
      response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');
      return;
    }

    response.writeHead(200,{
      'Cache-Control':'no-store',
      'Content-Type':MIME_TYPES[path.extname(filePath)]||'application/octet-stream'
    });
    const stream=fs.createReadStream(filePath);
    stream.on('error',()=>response.destroy());
    stream.pipe(response);
  });
});

server.listen(PORT,HOST,()=>console.log(`Static test server: http://${HOST}:${PORT}`));

function shutdown(){
  server.close(error=>process.exit(error?1:0));
}

process.on('SIGINT',shutdown);
process.on('SIGTERM',shutdown);
