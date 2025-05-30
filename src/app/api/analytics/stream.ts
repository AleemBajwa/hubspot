import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface StreamResponse {
  data: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    // ... existing code ...
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// ... existing code ... 