import { NextRequest, NextResponse } from 'next/server';
import { QualifiedLead } from '../../../types/lead';
import { Client } from '@hubspot/api-client';

const hubspotApiKey = process.env.HUBSPOT_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Payload must be an array of qualified leads.' }, { status: 400 });
    }
    // If no API key, fallback to simulated sync
    if (!hubspotApiKey) {
      const results = body.map((lead: QualifiedLead) => {
        if (lead.qualificationScore >= 7) {
          return { email: lead.email, status: 'success (simulated)' };
        } else {
          return { email: lead.email, status: 'skipped', reason: 'Score below threshold' };
        }
      });
      return NextResponse.json({ results });
    }
    // Use HubSpot API client
    const hubspotClient = new Client({ accessToken: hubspotApiKey });
    const results = [];
    for (const lead of body) {
      if (lead.qualificationScore >= 7) {
        try {
          await hubspotClient.crm.contacts.basicApi.create({
            properties: {
              email: lead.email,
              firstname: lead.firstName,
              lastname: lead.lastName,
              company: lead.company,
              jobtitle: lead.title,
              phone: lead.phone,
              website: lead.website,
              industry: lead.industry,
              lead_qualification_score: lead.qualificationScore,
              qualification_reason: lead.qualificationReason,
              lead_source: 'AI Dashboard',
              company_intelligence: lead.companyIntelligence,
            },
          });
          results.push({ email: lead.email, status: 'success' });
        } catch (err: any) {
          results.push({ email: lead.email, status: 'error', reason: err.message });
        }
      } else {
        results.push({ email: lead.email, status: 'skipped', reason: 'Score below threshold' });
      }
    }
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 