/* Minimal zero-dependency static server for local preview only. */
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=__dirname, PORT=5500;
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
  '.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(url.parse(req.url).pathname);
  if(p.endsWith('/'))p+='index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)){res.writeHead(403);return res.end('no');}
  fs.readFile(f,(e,buf)=>{
    if(e){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('404 '+p);}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});
    res.end(buf);
  });
}).listen(PORT,()=>console.log('static server on http://localhost:'+PORT));
