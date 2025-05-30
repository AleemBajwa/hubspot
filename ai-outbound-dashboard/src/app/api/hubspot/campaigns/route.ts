import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';

const hubspotApiKey = process.env.HUBSPOT_API_KEY;

interface HubSpotCampaign {
  id: string;
  name: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string | null;
}

interface HubSpotCampaignAnalytics {
  totalContacts: number;
  conversions: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  conversionRate: number;
  bounceRate: number;
}

interface HubSpotCampaignsResponse {
  results: HubSpotCampaign[];
  total: number;
  paging?: {
    next?: {
      after: string;
    };
  };
}

interface HubSpotCampaignAnalyticsResponse {
  data: HubSpotCampaignAnalytics;
}

export async function GET(req: NextRequest) {
  if (!hubspotApiKey) {
    return NextResponse.json({ error: 'HubSpot API key not configured' }, { status: 401 });
  }

  try {
    const hubspotClient = new Client({ accessToken: hubspotApiKey });
    
    // Fetch marketing campaigns using the marketing API
    const marketingCampaignsResponse = await fetch(
      `https://api.hubapi.com/marketing/v3/marketing/campaigns?limit=100&archived=false`,
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!marketingCampaignsResponse.ok) {
      throw new Error(`Failed to fetch campaigns: ${marketingCampaignsResponse.statusText}`);
    }

    const marketingCampaigns: HubSpotCampaignsResponse = await marketingCampaignsResponse.json();

    // Fetch campaign analytics for each campaign
    const campaignsWithAnalytics = await Promise.all(
      marketingCampaigns.results.map(async (campaign: HubSpotCampaign) => {
        try {
          const analyticsResponse = await fetch(
            `https://api.hubapi.com/marketing/v3/marketing/campaigns/${campaign.id}/analytics?timeRange=LAST_30_DAYS`,
            {
              headers: {
                Authorization: `Bearer ${hubspotApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!analyticsResponse.ok) {
            throw new Error(`Failed to fetch campaign analytics: ${analyticsResponse.statusText}`);
          }

          const analytics: HubSpotCampaignAnalytics = await analyticsResponse.json();

          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            type: campaign.type,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            leads: analytics.totalContacts || 0,
            conversions: analytics.conversions || 0,
            metrics: {
              emailsSent: analytics.emailsSent || 0,
              emailsDelivered: analytics.emailsDelivered || 0,
              emailsOpened: analytics.emailsOpened || 0,
              emailsClicked: analytics.emailsClicked || 0,
              conversionRate: analytics.conversionRate || 0,
              bounceRate: analytics.bounceRate || 0,
            },
            lastUpdated: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`Error fetching analytics for campaign ${campaign.id}:`, err);
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            type: campaign.type,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            leads: 0,
            conversions: 0,
            metrics: {
              emailsSent: 0,
              emailsDelivered: 0,
              emailsOpened: 0,
              emailsClicked: 0,
              conversionRate: 0,
              bounceRate: 0,
            },
            error: 'Failed to fetch campaign analytics',
            lastUpdated: new Date().toISOString(),
          };
        }
      })
    );

    return NextResponse.json({
      campaigns: campaignsWithAnalytics,
      total: marketingCampaigns.total,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('HubSpot campaigns error:', err);
    // Fallback to simulated data on error
    const campaigns = [
      {
        id: 'cmp-1',
        name: 'Spring Launch',
        status: 'active',
        type: 'email',
        startDate: new Date().toISOString(),
        endDate: null,
        leads: 50,
        conversions: 12,
        metrics: {
          emailsSent: 100,
          emailsDelivered: 95,
          emailsOpened: 45,
          emailsClicked: 20,
          conversionRate: 0.24,
          bounceRate: 0.05,
        },
        error: err.message,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'cmp-2',
        name: 'Summer Promo',
        status: 'completed',
        type: 'email',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        leads: 80,
        conversions: 30,
        metrics: {
          emailsSent: 150,
          emailsDelivered: 142,
          emailsOpened: 68,
          emailsClicked: 35,
          conversionRate: 0.375,
          bounceRate: 0.053,
        },
        error: err.message,
        lastUpdated: new Date().toISOString(),
      },
    ];
    return NextResponse.json({
      campaigns,
      total: campaigns.length,
      error: err.message,
      lastUpdated: new Date().toISOString(),
    });
  }
} 