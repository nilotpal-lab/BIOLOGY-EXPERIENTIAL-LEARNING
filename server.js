const { createServer } = require('http')
const { readFileSync, statSync } = require('fs')
const { join, extname } = require('path')

const dir = process.argv[2] || '.'
const port = parseInt(process.argv[3]) || 9000

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  let path = url.pathname
  if (path === '/') path = '/index.html'
  const filePath = join(dir, path)
  try {
    if (statSync(filePath).isDirectory()) return res.writeHead(404).end('not found')
    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
    res.end(readFileSync(filePath))
  } catch {
    res.writeHead(404).end('not found')
  }
})
server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`))
