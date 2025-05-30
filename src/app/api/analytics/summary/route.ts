import { NextResponse } from 'next/server';
import { withCache, createCacheKey } from '@/lib/cache';

async function fetchAnalyticsData() {
  // In a real app, these would be fetched from a database
  // For now, we'll return simulated data
  return {
    totalLeads: 120,
    qualifiedLeads: 85,
    activeCampaigns: 3,
    conversionRate: 0.28,
    recentActivity: [
      {
        type: 'lead_upload',
        description: '50 new leads uploaded and qualified',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        type: 'campaign',
        description: 'Campaign "Q2 Outreach" completed with 75% conversion rate',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        type: 'sync',
        description: '25 qualified leads synced to HubSpot',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      },
      {
        type: 'qualification',
        description: 'Lead qualification process completed for 100 leads',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
    ],
    funnel: [
      { name: 'Week 1', leads: 20, qualified: 12, synced: 8 },
      { name: 'Week 2', leads: 30, qualified: 20, synced: 15 },
      { name: 'Week 3', leads: 35, qualified: 25, synced: 20 },
      { name: 'Week 4', leads: 35, qualified: 28, synced: 27 },
    ],
    campaignMetrics: {
      emailDeliveryRate: 0.98,
      openRate: 0.45,
      clickThroughRate: 0.32,
      responseRate: 0.28,
      leadQualificationSuccess: 0.75,
      campaignROI: 2.5,
    },
  };
}

export async function GET() {
  try {
    const cacheKey = createCacheKey('analytics:summary', {});
    const analytics = await withCache(cacheKey, fetchAnalyticsData, 60 * 1000); // Cache for 1 minute

    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return NextResponse.json(analytics, { headers });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
} 