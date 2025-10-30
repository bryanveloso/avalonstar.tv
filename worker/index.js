export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/ws') {
      return new Response('Not found', { status: 404 });
    }

    // Create WebSocket pair for client connection
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection from the client
    server.accept();

    // Connect to backend WebSocket
    const backendUrl = 'ws://100.87.170.6:8088/ws';

    try {
      const backend = new WebSocket(backendUrl);

      backend.addEventListener('open', () => {
        console.log('Connected to backend WebSocket');
      });

      backend.addEventListener('message', (event) => {
        // Forward messages from backend to client
        server.send(event.data);
      });

      backend.addEventListener('close', () => {
        console.log('Backend WebSocket closed');
        server.close();
      });

      backend.addEventListener('error', (error) => {
        console.error('Backend WebSocket error:', error);
        server.close();
      });

      server.addEventListener('message', (event) => {
        // Forward messages from client to backend
        if (backend.readyState === WebSocket.OPEN) {
          backend.send(event.data);
        }
      });

      server.addEventListener('close', () => {
        console.log('Client WebSocket closed');
        backend.close();
      });

    } catch (error) {
      console.error('Failed to connect to backend:', error);
      server.close();
      return new Response('Failed to connect to backend', { status: 502 });
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
