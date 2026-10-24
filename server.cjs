const { createServer } = require('http')
const { readFileSync, statSync } = require('fs')
const { join, extname } = require('path')
const dir = 'dist'
const port = 4205
const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png' }
const server = createServer((req,res)=>{
  let p=req.url==='/' ? '/index.html' : req.url.split('?')[0]
  const f=join(dir,p)
  try {
    if(statSync(f).isDirectory()) return res.writeHead(404).end()
    res.writeHead(200,{ 'Content-Type': mime[extname(f)]||'application/octet-stream' })
    res.end(readFileSync(f))
  } catch { res.writeHead(404).end() }
})
server.listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port))
