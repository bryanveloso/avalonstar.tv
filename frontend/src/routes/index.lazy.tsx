import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createLazyFileRoute('/')({
  component: Dashboard,
})

interface User {
  userId: string;
  username: string;
  displayName?: string;
  provider: string;
}

function Dashboard() {
  const [wsConnected, setWsConnected] = useState(false)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8088'}/api/me`,
          {
            credentials: 'include',
          }
        );
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Native WebSocket connection with Bun
    const ws = new WebSocket(
      import.meta.env.VITE_WS_URL || 'ws://localhost:8088/ws'
    );

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

  const handleLogin = (provider: 'discord' | 'twitch') => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || 'http://localhost:8088'
    }/auth/${provider}`;
  };

  const handleLogout = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || 'http://localhost:8088'
    }/auth/logout`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Crusader Hub</h1>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <div className="font-semibold">
                  {user.displayName || user.username}
                </div>
                <div className="text-gray-400 text-xs">via {user.provider}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleLogin('discord')}
                className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] rounded font-medium"
              >
                Login with Discord
              </button>
              <button
                onClick={() => handleLogin('twitch')}
                className="px-4 py-2 bg-[#9146FF] hover:bg-[#772CE8] rounded font-medium"
              >
                Login with Twitch
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`mt-2 ${wsConnected ? 'text-green-500' : 'text-red-500'}`}
      >
        {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div className="mt-8">
        {user ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Welcome back, {user.displayName || user.username}!
            </h2>
            <p>You're logged in and connected to the community.</p>
          </div>
        ) : (
          <p>
            Welcome to your community dashboard! Log in to access member
            features.
          </p>
        )}
      </div>
    </div>
  );
}
