import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';

interface WebSocketMessage {
  type: string;
  data: unknown;
}

interface WebSocketError {
  type: 'error';
  message: string;
}

type WebSocketResponse = WebSocketMessage | WebSocketError;

export function GET(req: Request) {
  // ... existing code ...
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message) as WebSocketMessage;
      // ... existing code ...
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      ws.send(JSON.stringify({ type: 'error', message: errorMessage }));
    }
  });
  // ... existing code ...
}
// ... existing code ... 