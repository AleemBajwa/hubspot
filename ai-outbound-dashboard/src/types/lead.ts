export interface Lead {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
}

export interface QualifiedLead extends Lead {
  qualificationScore: number; // 1-10
  qualificationReason: string;
  confidenceLevel: number; // 0-1
  companyIntelligence?: string;
  recentNews?: string[];
  techStack?: string[];
  companySize?: string;
  fundingStatus?: string;
  growthIndicators?: string[];
  competitorAnalysis?: string[];
  qualifiedAt: Date;
  processingTime: number; // milliseconds
}

export interface HubSpotContact {
  email: string;
  firstname: string;
  lastname: string;
  company: string;
  jobtitle: string;
  phone?: string;
  website?: string;
  industry?: string;
  lead_qualification_score?: number;
  qualification_reason?: string;
  lead_source?: string;
  created_by_automation?: boolean;
  last_qualification_date?: string;
  company_intelligence?: string; // JSON stringified
} 