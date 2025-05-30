import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '../../../../types/lead';
import Papa from 'papaparse';

const requiredFields = [
  'firstName',
  'lastName',
  'email',
  'company',
  'title',
];

function validateLead(lead: any): string[] {
  const errors: string[] = [];
  requiredFields.forEach((field) => {
    if (!lead[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  // Email format validation
  if (lead.email && !/^\S+@\S+\.\S+$/.test(lead.email)) {
    errors.push('Invalid email format');
  }
  // Add more validation as needed
  return errors;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const csvText = Buffer.from(arrayBuffer).toString('utf-8');
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parsing error', details: parsed.errors }, { status: 400 });
    }
    let leads = parsed.data as any[];
    if (leads.length > 1000) {
      return NextResponse.json({ error: 'Batch size limit exceeded (max 1000 leads).' }, { status: 400 });
    }
    const validLeads: Lead[] = [];
    const invalidLeads: { lead: any; errors: string[]; index: number }[] = [];
    leads.forEach((lead, idx) => {
      const errors = validateLead(lead);
      if (errors.length === 0) {
        validLeads.push(lead as Lead);
      } else {
        invalidLeads.push({ lead, errors, index: idx });
      }
    });
    return NextResponse.json({ validLeads, invalidLeads, previewCount: leads.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 