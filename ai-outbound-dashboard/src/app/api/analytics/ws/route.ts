import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { Server } from 'http';

// Store active WebSocket connections
const clients = new Set<WebSocket>();

// Initialize WebSocket server
let wss: WebSocketServer | null = null;

// Function to broadcast updates to all connected clients
function broadcastUpdate(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Function to fetch latest analytics data
async function fetchLatestAnalytics() {
  try {
    const response = await fetch('http://localhost:3000/api/hubspot/analytics');
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return await response.json();
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return null;
  }
}

// Function to start periodic updates
function startPeriodicUpdates(interval: number = 10000) {
  return setInterval(async () => {
    const analytics = await fetchLatestAnalytics();
    if (analytics) {
      broadcastUpdate(analytics);
    }
  }, interval);
}

export async function GET(req: NextRequest) {
  if (!wss) {
    // Create WebSocket server if it doesn't exist
    const server = (req as any).socket?.server as Server;
    if (!server) {
      return new Response('WebSocket server not available', { status: 500 });
    }

    wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket connections
    wss.on('connection', (ws) => {
      clients.add(ws);

      // Send initial data
      fetchLatestAnalytics().then((analytics) => {
        if (analytics) {
          ws.send(JSON.stringify(analytics));
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
      });
    });

    // Handle upgrade requests
    server.on('upgrade', (request, socket, head) => {
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    });

    // Start periodic updates
    startPeriodicUpdates();
  }

  // Return a response that will be upgraded to WebSocket
  return new Response(null, {
    status: 101,
    headers: {
      Upgrade: 'websocket',
      Connection: 'Upgrade',
    },
  });
}

// Cleanup function to close WebSocket server
export function cleanup() {
  if (wss) {
    wss.close();
    wss = null;
  }
  clients.clear();
} 