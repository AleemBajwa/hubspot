import { NextRequest } from 'next/server';
import type { NextApiResponse } from 'next';

// This is a workaround for Next.js API routes to support SSE (for dev/demo only)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }
      // Simulate sending analytics updates every 10 seconds
      let count = 0;
      const interval = setInterval(() => {
        const analytics = {
          totalLeadsUploaded: 120 + count,
          totalQualified: 85 + Math.floor(count / 2),
          totalSynced: 70 + Math.floor(count / 3),
          funnel: [
            { name: 'Week 1', leads: 20, qualified: 12, synced: 8 },
            { name: 'Week 2', leads: 30, qualified: 20, synced: 15 },
            { name: 'Week 3', leads: 35, qualified: 25, synced: 20 },
            { name: 'Week 4', leads: 35 + count, qualified: 28 + Math.floor(count / 2), synced: 27 + Math.floor(count / 3) },
          ],
        };
        sendEvent(analytics);
        count++;
      }, 10000);
      // Send initial event immediately
      sendEvent({
        totalLeadsUploaded: 120,
        totalQualified: 85,
        totalSynced: 70,
        funnel: [
          { name: 'Week 1', leads: 20, qualified: 12, synced: 8 },
          { name: 'Week 2', leads: 30, qualified: 20, synced: 15 },
          { name: 'Week 3', leads: 35, qualified: 25, synced: 20 },
          { name: 'Week 4', leads: 35, qualified: 28, synced: 27 },
        ],
      });
      // Clean up
      req.signal?.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 