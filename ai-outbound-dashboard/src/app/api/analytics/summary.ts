import { NextRequest, NextResponse } from 'next/server';

// In a real app, this would query a database or persistent store.
// For now, return simulated analytics data.
export async function GET(req: NextRequest) {
  // Simulated metrics (replace with real aggregation logic)
  const analytics = {
    totalLeadsUploaded: 120,
    totalQualified: 85,
    totalSynced: 70,
    funnel: [
      { name: 'Week 1', leads: 20, qualified: 12, synced: 8 },
      { name: 'Week 2', leads: 30, qualified: 20, synced: 15 },
      { name: 'Week 3', leads: 35, qualified: 25, synced: 20 },
      { name: 'Week 4', leads: 35, qualified: 28, synced: 27 },
    ],
  };
  return NextResponse.json(analytics);
} 