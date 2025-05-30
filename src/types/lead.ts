export interface Lead {
  id: string;
  company: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  contact: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  source: string;
  status: 'new' | 'qualified' | 'disqualified' | 'contacted';
  score?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface QualifiedLead extends Lead {
  score: number;
  qualification: {
    reason: string;
    confidence: number;
    criteria: Array<{
      name: string;
      score: number;
      weight: number;
      details: Record<string, unknown>;
    }>;
  };
  enrichment?: {
    companyInfo?: Record<string, unknown>;
    contactInfo?: Record<string, unknown>;
    socialProfiles?: Record<string, unknown>;
  };
}

export type LeadInput = Omit<Lead, 'id' | 'status' | 'score' | 'createdAt' | 'updatedAt'>;

export type LeadUpdate = Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>;

export interface LeadQualificationResult {
  lead: QualifiedLead;
  timestamp: string;
  processingTime: number;
  model: string;
  version: string;
} 