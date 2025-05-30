import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Lead, QualifiedLead } from '../types/lead';

// Initialize the OpenAI model
const model = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.2,
  maxTokens: 256,
});

// Define the prompt template for company research
const companyResearchPrompt = PromptTemplate.fromTemplate(`
You are a business intelligence expert. Analyze the following company information and provide a structured analysis.
Company: {company}

Provide a JSON response with the following structure:
{
  "companySize": "string (e.g., '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')",
  "fundingStatus": "string (e.g., 'Bootstrapped', 'Seed', 'Series A', 'Series B+', 'Public')",
  "techStack": ["string"],
  "growthIndicators": ["string"],
  "competitorAnalysis": ["string"],
  "recentNews": ["string"]
}

Focus on factual information and avoid speculation. If information is not available, use null for that field.
`);

// Define the prompt template for lead qualification
const leadQualificationPrompt = PromptTemplate.fromTemplate(`
You are an expert lead qualification specialist. Evaluate the following lead and company information to determine if they are a good fit.

Lead Information:
{lead}

Company Analysis:
{companyAnalysis}

Score the lead from 1-10 based on the following criteria:
1. Company size and growth potential
2. Industry fit and market position
3. Role and seniority
4. Contact information quality
5. Overall potential value

Provide a JSON response with the following structure:
{
  "qualificationScore": number (1-10),
  "qualificationReason": "string (detailed explanation)",
  "confidenceLevel": number (0-1),
  "keyStrengths": ["string"],
  "potentialConcerns": ["string"],
  "recommendedNextSteps": ["string"]
}

Be specific and data-driven in your analysis.
`);

// Create the company research chain
const companyResearchChain = RunnableSequence.from([
  companyResearchPrompt,
  model,
  new StringOutputParser(),
]);

// Create the lead qualification chain
const leadQualificationChain = RunnableSequence.from([
  leadQualificationPrompt,
  model,
  new StringOutputParser(),
]);

// Main function to qualify a lead
export async function qualifyLead(lead: Lead): Promise<QualifiedLead> {
  try {
    // Step 1: Research company information
    const companyAnalysis = await companyResearchChain.invoke({
      company: lead.company,
    });

    // Parse company analysis
    const companyInfo = JSON.parse(companyAnalysis);

    // Step 2: Qualify the lead
    const qualificationResult = await leadQualificationChain.invoke({
      lead: JSON.stringify(lead),
      companyAnalysis: JSON.stringify(companyInfo),
    });

    // Parse qualification result
    const qualification = JSON.parse(qualificationResult);

    // Combine all information into a QualifiedLead
    const qualifiedLead: QualifiedLead = {
      ...lead,
      qualificationScore: qualification.qualificationScore,
      qualificationReason: qualification.qualificationReason,
      confidenceLevel: qualification.confidenceLevel,
      companyIntelligence: JSON.stringify(companyInfo),
      recentNews: companyInfo.recentNews,
      techStack: companyInfo.techStack,
      companySize: companyInfo.companySize,
      fundingStatus: companyInfo.fundingStatus,
      growthIndicators: companyInfo.growthIndicators,
      competitorAnalysis: companyInfo.competitorAnalysis,
      qualifiedAt: new Date(),
      processingTime: Date.now() - Date.now(), // Will be updated with actual processing time
    };

    return qualifiedLead;
  } catch (error) {
    console.error('Error qualifying lead:', error);
    // Return a fallback qualified lead with minimum information
    return {
      ...lead,
      qualificationScore: 1,
      qualificationReason: 'Error during qualification process',
      confidenceLevel: 0,
      qualifiedAt: new Date(),
      processingTime: 0,
    };
  }
}

// Batch qualification function
export async function qualifyLeads(leads: Lead[]): Promise<QualifiedLead[]> {
  const startTime = Date.now();
  const qualifiedLeads = await Promise.all(
    leads.map(async (lead) => {
      const qualifiedLead = await qualifyLead(lead);
      qualifiedLead.processingTime = Date.now() - startTime;
      return qualifiedLead;
    })
  );
  return qualifiedLeads;
} 