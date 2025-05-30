import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '../../../../types/lead';
import { qualifyLeads } from '../../../../lib/lead-qualification';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Payload must be an array of leads.' }, { status: 400 });
    }

    // Validate leads
    const validLeads: Lead[] = body.filter((lead: any) => {
      return lead.firstName && lead.lastName && lead.email && lead.company && lead.title;
    });

    if (validLeads.length === 0) {
      return NextResponse.json({ error: 'No valid leads provided.' }, { status: 400 });
    }

    // Use the new Langchain-based qualification
    const qualifiedLeads = await qualifyLeads(validLeads);

    return NextResponse.json({ qualifiedLeads });
  } catch (err: any) {
    console.error('Lead qualification error:', err);
    return NextResponse.json(
      { error: err.message || 'Error during lead qualification' },
      { status: 500 }
    );
  }
} 