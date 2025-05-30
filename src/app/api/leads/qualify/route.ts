import { NextRequest, NextResponse } from 'next/server';
import { Lead, LeadQualificationResult } from '@/types/lead';
import { qualifyLead } from '@/lib/ai/workflow';
import { logger } from '@/lib/logger';

interface QualificationRequest {
  leads: Lead[];
  options?: {
    batchSize?: number;
    timeout?: number;
    priority?: 'high' | 'normal' | 'low';
  };
}

interface Lead {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  [key: string]: unknown;
}

interface QualificationResult {
  qualified: boolean;
  score: number;
  reason: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as QualificationRequest;
    const { leads, options } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: leads must be a non-empty array' },
        { status: 400 }
      );
    }

    const results: LeadQualificationResult[] = [];
    const batchSize = options?.batchSize || 10;
    const timeout = options?.timeout || 30000; // 30 seconds default

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const batchPromises = batch.map(lead => 
        Promise.race([
          qualifyLead(lead),
          new Promise<LeadQualificationResult>((_, reject) => 
            setTimeout(() => reject(new Error('Qualification timeout')), timeout)
          )
        ])
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(
        ...batchResults
          .filter((result): result is PromiseFulfilledResult<LeadQualificationResult> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value)
      );
    }

    logger.info('Lead qualification completed', {
      totalLeads: leads.length,
      qualifiedLeads: results.length,
      options
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error qualifying leads', { error: errorMessage });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 