import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
  .onRequest(() => {
    console.log('Request received!')
  })
  .onError(({ error, code }) => {
    console.error('ERROR:', code, error)
    return { error: error.message }
  })
  .use(cors({
    origin: (origin) => {
      const allowed = [
        'http://localhost:5173',
        'http://100.87.170.6:3001',
        'http://saya:3001',
        process.env.FRONTEND_URL
      ].filter(Boolean)
      return allowed.includes(origin) || true // Allow all for now
    }
  }))
  .get('/health', () => ({ status: 'ok' }))
  .group('/api', app => app
    // Quotes from Elsydeon
    .get('/quotes', async ({ set }) => {
      try {
        const url = `${process.env.ELSYDEON_URL}/api/quotes`
        console.log(`Fetching quotes from: ${url}`)
        const res = await fetch(url)

        if (!res.ok) {
          console.error(`Elsydeon error: ${res.status} ${res.statusText}`)
          set.status = 502
          return { error: `Elsydeon API returned ${res.status}` }
        }

        const data = await res.json()
        return data
      } catch (error) {
        console.error('Failed to fetch quotes:', error)
        set.status = 502
        return { error: 'Failed to connect to Elsydeon', details: String(error) }
      }
    })
    // Everything else from Synthform
    .get('/characters', async () => {
      const res = await fetch(`${process.env.SYNTHFORM_URL}/api/characters`)
      return res.json()
    })
    .get('/emotes', async () => {
      const res = await fetch(`${process.env.SYNTHFORM_URL}/api/emotes`)
      return res.json()
    })
    // Static data
    .get('/perks', () => {
      return {
        minecraft: {
          server: 'mc.avalonstar.tv',
          version: '1.21'
        },
        ragnarok: {
          server: 'Coming Soon'
        }
      }
    })
  )
  // WebSocket relay for Synthform events (using Bun's native WebSocket)
  .ws('/ws', {
    async open(ws) {
      // Connect to Synthform WebSocket when client connects
      // Bun has native WebSocket support
      const synthformWs = new WebSocket(process.env.SYNTHFORM_WS_URL || 'ws://localhost:8001')

      synthformWs.addEventListener('message', (event) => {
        // Forward Synthform events to client
        ws.send(event.data)
      })

      synthformWs.addEventListener('error', (error) => {
        console.error('Synthform WebSocket error:', error)
      })

      // Store connection for cleanup
      ws.data.synthformWs = synthformWs
      console.log('Client connected to relay')
    },
    message(ws, message) {
      // Handle any client->server messages if needed
      console.log('Received from client:', message)
    },
    close(ws) {
      // Clean up Synthform connection
      ws.data.synthformWs?.close()
      console.log('Client disconnected')
    }
  })
  .listen({ port: 8080, hostname: '0.0.0.0' })

console.log(`🚀 Backend running at ${app.server?.hostname}:${app.server?.port}`)
console.log(`📍 ELSYDEON_URL: ${process.env.ELSYDEON_URL}`)
console.log(`📍 SYNTHFORM_URL: ${process.env.SYNTHFORM_URL}`)