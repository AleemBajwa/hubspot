import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface WorkflowError {
  error: string;
  status: number;
}

export async function GET(_req: NextRequest) {
  try {
    // ... existing code ...
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// ... existing code ... 