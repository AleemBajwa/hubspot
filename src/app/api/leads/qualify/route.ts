import { NextRequest, NextResponse } from 'next/server';
import { qualifyLeadsWithWorkflow } from '../../../lib/ai/workflow';
import { Lead } from '../../../types/lead';
import { withCache, createCacheKey } from '../../../lib/cache';

export async function POST(req: NextRequest) {
  try {
    const { leads } = await req.json();

    if (!Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Invalid request: leads must be an array' },
        { status: 400 }
      );
    }

    // Validate lead data
    const validatedLeads = leads.map((lead: any) => {
      const { firstName, lastName, email, company, title, ...rest } = lead;
      if (!firstName || !lastName || !email || !company || !title) {
        throw new Error('Invalid lead data: missing required fields');
      }
      return { firstName, lastName, email, company, title, ...rest } as Lead;
    });

    // Use caching for lead qualification
    const cacheKey = createCacheKey('leads:qualification', {
      leads: validatedLeads.map(l => `${l.email}:${l.company}`).join(','),
    });

    const qualifiedLeads = await withCache(
      cacheKey,
      () => qualifyLeadsWithWorkflow(validatedLeads),
      5 * 60 * 1000 // Cache for 5 minutes
    );

    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return NextResponse.json({ qualifiedLeads }, { headers });
  } catch (error) {
    console.error('Error qualifying leads:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to qualify leads' },
      { status: 500 }
    );
  }
} 