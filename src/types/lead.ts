export interface Lead {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  linkedinUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  notes?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface QualifiedLead extends Lead {
  qualificationScore: number;
  qualificationReason: string;
  confidenceLevel: number;
  companyIntelligence?: string;
  recentNews?: string[];
  techStack?: string[];
  companySize?: string;
  fundingStatus?: string;
  growthIndicators?: string[];
  competitorAnalysis?: string[];
  qualifiedAt: Date;
  processingTime: number;
  status?: 'qualified' | 'unqualified' | 'pending';
  nextSteps?: string[];
  recommendedApproach?: string;
  riskFactors?: string[];
  opportunityScore?: number;
  estimatedValue?: number;
  lastUpdated?: Date;
} 