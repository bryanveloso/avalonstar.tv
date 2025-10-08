const DIST_PATH = process.env.DIST_PATH || './dist'
const PORT = parseInt(process.env.PORT || '3000')

// Content types for common file extensions
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function getContentType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf('.'))
  return contentTypes[ext] || 'application/octet-stream'
}

// Start Bun server
const server = Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    // Health check endpoint
    if (path === '/health') {
      return new Response('OK', {
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }
      })
    }

    // Handle SPA routing - serve index.html for all routes except static assets
    const filePath = path === '/' ? 'index.html' : path
    const file = Bun.file(`${DIST_PATH}/${filePath}`)

    // Check if file exists
    if (file.size === 0) {
      // Serve index.html for client-side routing
      const indexFile = Bun.file(`${DIST_PATH}/index.html`)
      if (indexFile.size > 0) {
        return new Response(indexFile, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        })
      }
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    const contentType = getContentType(filePath)
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
      }
    })
  }
})

console.log(`Frontend server running at http://localhost:${server.port}`)

// Graceful shutdown
process.on('SIGTERM', () => {
  server.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  server.stop()
  process.exit(0)
})