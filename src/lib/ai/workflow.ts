import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Lead, QualifiedLead } from "../../types/lead";

// Initialize the language model
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.2,
});

// Define the state type for our workflow
interface WorkflowState {
  lead: Lead;
  companyInfo?: any;
  qualificationScore?: number;
  qualificationReason?: string;
  confidenceLevel?: number;
  error?: string;
}

// Step 1: Company Research
const companyResearchPrompt = PromptTemplate.fromTemplate(`
  Research the following company and provide detailed information:
  Company Name: {company}
  
  Please provide information about:
  1. Company size and industry
  2. Recent news and developments
  3. Technology stack
  4. Funding status
  5. Growth indicators
  6. Competitors
  
  Format the response as a JSON object with these fields.
`);

const companyResearchChain = RunnableSequence.from([
  companyResearchPrompt,
  model,
  new StringOutputParser(),
]);

// Step 2: Lead Qualification
const leadQualificationPrompt = PromptTemplate.fromTemplate(`
  Analyze the following lead and company information to determine qualification:
  
  Lead Information:
  {lead}
  
  Company Information:
  {companyInfo}
  
  Please evaluate the lead based on:
  1. Job title relevance
  2. Company size and industry fit
  3. Technology stack alignment
  4. Growth potential
  5. Recent company developments
  
  Provide:
  1. A qualification score (1-10)
  2. Detailed reasoning
  3. Confidence level (0-1)
  
  Format the response as a JSON object with these fields.
`);

const leadQualificationChain = RunnableSequence.from([
  leadQualificationPrompt,
  model,
  new StringOutputParser(),
]);

// Define the workflow nodes
async function researchCompany(state: WorkflowState): Promise<WorkflowState> {
  try {
    const companyInfo = await companyResearchChain.invoke({
      company: state.lead.company,
    });
    return { ...state, companyInfo: JSON.parse(companyInfo) };
  } catch (error) {
    return { ...state, error: "Failed to research company" };
  }
}

async function qualifyLead(state: WorkflowState): Promise<WorkflowState> {
  if (state.error) return state;
  
  try {
    const qualification = await leadQualificationChain.invoke({
      lead: JSON.stringify(state.lead),
      companyInfo: JSON.stringify(state.companyInfo),
    });
    
    const result = JSON.parse(qualification);
    return {
      ...state,
      qualificationScore: result.qualificationScore,
      qualificationReason: result.qualificationReason,
      confidenceLevel: result.confidenceLevel,
    };
  } catch (error) {
    return { ...state, error: "Failed to qualify lead" };
  }
}

// Create the workflow graph
const workflow = new StateGraph<WorkflowState>({
  channels: {
    lead: { value: null },
    companyInfo: { value: null },
    qualificationScore: { value: null },
    qualificationReason: { value: null },
    confidenceLevel: { value: null },
    error: { value: null },
  },
});

// Add nodes to the graph
workflow.addNode("researchCompany", researchCompany);
workflow.addNode("qualifyLead", qualifyLead);

// Define the edges
workflow.addEdge("researchCompany", "qualifyLead");
workflow.addEdge("qualifyLead", END);

// Set the entry point
workflow.setEntryPoint("researchCompany");

// Compile the workflow
const leadQualificationWorkflow = workflow.compile();

// Main function to qualify a lead using the workflow
export async function qualifyLeadWithWorkflow(lead: Lead): Promise<QualifiedLead> {
  try {
    const result = await leadQualificationWorkflow.invoke({
      lead,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      ...lead,
      qualificationScore: result.qualificationScore!,
      qualificationReason: result.qualificationReason!,
      confidenceLevel: result.confidenceLevel!,
      companyIntelligence: JSON.stringify(result.companyInfo),
      recentNews: result.companyInfo.recentNews,
      techStack: result.companyInfo.techStack,
      companySize: result.companyInfo.companySize,
      fundingStatus: result.companyInfo.fundingStatus,
      growthIndicators: result.companyInfo.growthIndicators,
      competitorAnalysis: result.companyInfo.competitors,
      qualifiedAt: new Date(),
      processingTime: Date.now() - Date.now(), // Will be updated with actual processing time
    };
  } catch (error) {
    console.error("Error in lead qualification workflow:", error);
    return {
      ...lead,
      qualificationScore: 1,
      qualificationReason: "Error during qualification process",
      confidenceLevel: 0,
      qualifiedAt: new Date(),
      processingTime: 0,
    };
  }
}

// Batch qualification function
export async function qualifyLeadsWithWorkflow(leads: Lead[]): Promise<QualifiedLead[]> {
  const startTime = Date.now();
  const qualifiedLeads = await Promise.all(
    leads.map(async (lead) => {
      const qualifiedLead = await qualifyLeadWithWorkflow(lead);
      qualifiedLead.processingTime = Date.now() - startTime;
      return qualifiedLead;
    })
  );
  return qualifiedLeads;
} 