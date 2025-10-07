import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createLazyFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    // Native WebSocket connection with Bun
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws')

    ws.onopen = () => {
      setWsConnected(true)
      console.log('Connected to backend WebSocket')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received event:', data)
      // Handle real-time events from Synthform
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setWsConnected(false)
    }

    ws.onclose = () => {
      setWsConnected(false)
      console.log('Disconnected from backend')
    }

    return () => ws.close()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Crusader Hub</h1>
      <div className={`mt-2 ${wsConnected ? 'text-green-500' : 'text-red-500'}`}>
        {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div className="mt-8">
        <p>Welcome to your community dashboard!</p>
      </div>
    </div>
  )
}