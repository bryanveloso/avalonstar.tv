import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { oauth2 } from 'elysia-oauth2'

// Maintain a single persistent connection to Synthform
let synthformWs: WebSocket | null = null;
const clients = new Set<any>();

function connectToSynthform() {
  const url = process.env.SYNTHFORM_WS_URL || 'ws://localhost:8001';
  console.log(`🔌 Connecting to Synthform at ${url}`);

  synthformWs = new WebSocket(url);

  synthformWs.onopen = () => {
    console.log('✅ Connected to Synthform WebSocket');
  };

  synthformWs.onmessage = (event) => {
    console.log('📨 Received from Synthform, broadcasting to', clients.size, 'clients');
    // Broadcast to all connected clients
    clients.forEach((client) => {
      try {
        client.send(event.data);
      } catch (e) {
        console.error('Failed to forward message to client:', e);
      }
    });
  };

  synthformWs.onerror = (error) => {
    console.error('❌ Synthform WebSocket error:', error);
  };

  synthformWs.onclose = () => {
    console.log('⚠️ Synthform WebSocket closed, reconnecting in 5s...');
    synthformWs = null;
    setTimeout(connectToSynthform, 5000);
  };
}

// Connect to Synthform on startup
connectToSynthform();

// Build OAuth providers config, only including configured providers
const oauthProviders: Record<string, [string, string, string]> = {};
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  oauthProviders.Discord = [
    process.env.DISCORD_CLIENT_ID,
    process.env.DISCORD_CLIENT_SECRET,
    process.env.DISCORD_REDIRECT_URI || 'http://localhost:8088/auth/discord/callback'
  ];
}
if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  oauthProviders.Twitch = [
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_CLIENT_SECRET,
    process.env.TWITCH_REDIRECT_URI || 'http://localhost:8088/auth/twitch/callback'
  ];
}

const app = new Elysia()
  .onRequest(() => {
    console.log('Request received!');
  })
  .onError(({ error, code }) => {
    console.error('ERROR:', code, error);
    return { error: error.message };
  })
  .use(
    cors({
      origin: (origin) => {
        const allowed = [
          'http://localhost:5173',
          'http://100.87.170.6:3001',
          'http://saya:3001',
          process.env.FRONTEND_URL,
        ].filter(Boolean);
        return allowed.includes(origin) || true; // Allow all for now
      },
      credentials: true,
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
    })
  )
  .use(
    oauth2(
      oauthProviders,
      {
        cookie: {
          secure: false, // Allow cookies over HTTP in development
          sameSite: 'lax',
          path: '/',
          httpOnly: true,
        },
      }
    )
  )
  .get('/health', () => ({ status: 'ok' }))
  // Auth routes
  .get('/auth/discord', ({ oauth2 }) => {
    if (!process.env.DISCORD_CLIENT_ID) {
      return { error: 'Discord OAuth not configured' };
    }
    return oauth2.redirect('Discord', ['identify', 'email']);
  })
  .get(
    '/auth/discord/callback',
    async ({ oauth2, jwt, cookie: { auth }, set }) => {
      try {
        const tokens = await oauth2.authorize('Discord');
        const accessToken = tokens.accessToken();

        // Fetch user info from Discord
        const userRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const user = await userRes.json();

        // Create JWT with user info
        const token = await jwt.sign({
          userId: user.id,
          username: user.username,
          provider: 'discord',
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        });

        auth.set({ value: token, httpOnly: true, maxAge: 60 * 60 * 24 * 7 });

        // Redirect to frontend with success
        set.status = 302;
        set.headers['Location'] = `${process.env.FRONTEND_URL}/?auth=success`;
        return;
      } catch (error) {
        console.error('Discord auth error:', error);
        set.status = 302;
        set.headers['Location'] = `${process.env.FRONTEND_URL}/?auth=error`;
        return;
      }
    }
  )
  .get('/auth/twitch', ({ oauth2 }) => {
    if (!process.env.TWITCH_CLIENT_ID) {
      return { error: 'Twitch OAuth not configured' };
    }
    return oauth2.redirect('Twitch', ['user:read:email']);
  })
  .get(
    '/auth/twitch/callback',
    async ({ oauth2, jwt, cookie: { auth }, set }) => {
      try {
        console.log('🔵 Twitch callback received');
        const tokens = await oauth2.authorize('Twitch');
        const accessToken = tokens.accessToken();
        console.log('🔵 Got access token');

        // Fetch user info from Twitch
        const userRes = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID!,
          },
        });
        const userData = await userRes.json();
        console.log('🔵 Twitch user data:', userData);

        const { data } = userData;
        const user = data[0];

        // Create JWT with user info
        const token = await jwt.sign({
          userId: user.id,
          username: user.login,
          displayName: user.display_name,
          provider: 'twitch',
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        });
        console.log('🔵 JWT created for user:', user.login);

        auth.set({ value: token, httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
        console.log('🔵 Cookie set, redirecting to success');

        // Redirect to frontend with success
        set.status = 302;
        set.headers['Location'] = `${process.env.FRONTEND_URL}/?auth=success`;
        return;
      } catch (error) {
        console.error('❌ Twitch auth error:', error);
        set.status = 302;
        set.headers['Location'] = `${process.env.FRONTEND_URL}/?auth=error`;
        return;
      }
    }
  )
  .get('/auth/logout', ({ cookie: { auth }, set }) => {
    auth.remove();
    set.status = 302;
    set.headers['Location'] = process.env.FRONTEND_URL || '/';
    return;
  })
  .group('/api', (app) =>
    app
      // Get current user info
      .get('/me', async ({ jwt, cookie: { auth }, set }) => {
        try {
          const token = await jwt.verify(auth.value);
          if (!token) {
            set.status = 401;
            return { error: 'Not authenticated' };
          }

          // Return basic user info from JWT
          return {
            userId: token.userId,
            username: token.username,
            displayName: token.displayName,
            provider: token.provider,
          };
        } catch (error) {
          set.status = 401;
          return { error: 'Invalid or expired token' };
        }
      })
      // All data from Synthform
      .get('/quotes', async ({ set }) => {
        try {
          const url = `${process.env.SYNTHFORM_URL}/api/quotes`;
          console.log(`Fetching quotes from: ${url}`);
          const res = await fetch(url);

          if (!res.ok) {
            console.error(`Synthform error: ${res.status} ${res.statusText}`);
            set.status = 502;
            return { error: `Synthform API returned ${res.status}` };
          }

          const data = await res.json();
          return data;
        } catch (error) {
          console.error('Failed to fetch quotes:', error);
          set.status = 502;
          return {
            error: 'Failed to connect to Synthform',
            details: String(error),
          };
        }
      })
      .get('/characters', async () => {
        const res = await fetch(`${process.env.SYNTHFORM_URL}/api/characters`);
        return res.json();
      })
      .get('/emotes', async () => {
        const res = await fetch(`${process.env.SYNTHFORM_URL}/api/emotes`);
        return res.json();
      })
      // Static data
      .get('/perks', () => {
        return {
          minecraft: {
            server: 'mc.avalonstar.tv',
            version: '1.21',
          },
          ragnarok: {
            server: 'Coming Soon',
          },
        };
      })
  )
  // Log all requests
  .onRequest(({ request }) => {
    console.log(`📥 ${request.method} ${request.url}`);
  })
  // WebSocket relay for Synthform events (using Bun's native WebSocket)
  .ws('/ws', {
    open(ws) {
      console.log('🔌 Client connected to WebSocket relay');
      clients.add(ws);
      console.log(`👥 Total clients: ${clients.size}`);
    },
    message(ws, message) {
      console.log('📨 Received from client:', message);
    },
    close(ws) {
      clients.delete(ws);
      console.log(`👋 Client disconnected. Remaining: ${clients.size}`);
    },
  })
  .listen({ port: 8088, hostname: '0.0.0.0' });

console.log(`🚀 Backend running at ${app.server?.hostname}:${app.server?.port}`)
console.log(`📍 SYNTHFORM_URL: ${process.env.SYNTHFORM_URL}`)
