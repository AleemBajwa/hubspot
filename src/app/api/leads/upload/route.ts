import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processLeads } from '@/lib/leads';

export async function POST(req: NextRequest) {
  try {
    const leads = await req.json();
    const result = await processLeads(leads);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing leads:', error);
    return NextResponse.json(
      { error: 'Failed to process leads' },
      { status: 500 }
    );
  }
} 