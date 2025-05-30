import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Lead, QualifiedLead, LeadQualificationResult } from "../../types/lead";
import { logger } from '../logger';

// Initialize the language model
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.2,
});

// Define the state type for our workflow
interface WorkflowState {
  lead: Lead;
  companyInfo?: Record<string, unknown>;
  qualificationScore?: number;
  qualificationReason?: string;
  confidenceLevel?: number;
  error?: string;
}

interface WorkflowError extends Error {
  code?: string;
  details?: unknown;
}

interface WorkflowStep {
  id: string;
  type: 'analysis' | 'validation' | 'enrichment';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: WorkflowError;
}

interface WorkflowContext {
  steps: WorkflowStep[];
  currentStep: number;
  data: Record<string, unknown>;
}

interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'process';
  next: string[];
}

const workflowGraph: Record<string, WorkflowNode> = {
  start: {
    id: 'start',
    type: 'start',
    next: ['researchCompany']
  },
  researchCompany: {
    id: 'researchCompany',
    type: 'process',
    next: ['qualifyLead']
  },
  qualifyLead: {
    id: 'qualifyLead',
    type: 'process',
    next: ['end']
  },
  end: {
    id: 'end',
    type: 'end',
    next: []
  }
};

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
  } catch (_error) {
    return { ...state, error: "Failed to research company" };
  }
}

async function qualifyLeadStep(state: WorkflowState): Promise<WorkflowState> {
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
  } catch (_error) {
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
workflow.addNode("qualifyLead", qualifyLeadStep);

// Define the edges
workflow.addEdge("researchCompany", "qualifyLead");
workflow.addEdge("qualifyLead", END);

// Set the entry point
workflow.setEntryPoint("researchCompany");

// Compile the workflow
const leadQualificationWorkflow = workflow.compile();

// Main function to qualify a lead using the workflow
export async function qualifyLeadWithWorkflow(lead: Lead): Promise<QualifiedLead> {
  const startTime = Date.now();
  try {
    const result = await leadQualificationWorkflow.invoke({
      lead,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    const score = result.qualificationScore!;
    const status = score >= 7 ? 'qualified' : 'disqualified';
    const qualification = {
      reason: result.qualificationReason!,
      confidence: result.confidenceLevel!,
      criteria: [
        {
          name: 'Job title relevance',
          score: Math.round(score * 0.2),
          weight: 0.2,
          details: { title: lead.contact.title }
        },
        {
          name: 'Company size and industry fit',
          score: Math.round(score * 0.2),
          weight: 0.2,
          details: { size: lead.size, industry: lead.industry }
        },
        {
          name: 'Technology stack alignment',
          score: Math.round(score * 0.2),
          weight: 0.2,
          details: { techStack: result.companyInfo?.techStack }
        },
        {
          name: 'Growth potential',
          score: Math.round(score * 0.2),
          weight: 0.2,
          details: { growthIndicators: result.companyInfo?.growthIndicators }
        },
        {
          name: 'Recent company developments',
          score: Math.round(score * 0.2),
          weight: 0.2,
          details: { recentNews: result.companyInfo?.recentNews }
        }
      ]
    };

    const enrichment = {
      companyInfo: {
        techStack: result.companyInfo?.techStack,
        recentNews: result.companyInfo?.recentNews,
        companySize: result.companyInfo?.companySize,
        fundingStatus: result.companyInfo?.fundingStatus,
        growthIndicators: result.companyInfo?.growthIndicators,
        competitors: result.companyInfo?.competitors
      }
    };

    return {
      ...lead,
      status,
      score,
      qualification,
      enrichment,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in lead qualification workflow:", error);
    return {
      ...lead,
      status: 'disqualified',
      score: 1,
      qualification: {
        reason: "Error during qualification process",
        confidence: 0,
        criteria: []
      },
      updatedAt: new Date().toISOString()
    };
  }
}

// Batch qualification function
export async function qualifyLeadsWithWorkflow(leads: Lead[]): Promise<QualifiedLead[]> {
  return Promise.all(leads.map(lead => qualifyLeadWithWorkflow(lead)));
}

// Helper function to get next steps in workflow
function getNextSteps(nodeId: string): string[] {
  const node = workflowGraph[nodeId];
  return node ? node.next : [];
}

// Helper function to validate workflow path
function validateWorkflowPath(path: string[]): boolean {
  if (path.length === 0) return false;
  if (path[0] !== 'start') return false;
  if (path[path.length - 1] !== 'end') return false;

  for (let i = 0; i < path.length - 1; i++) {
    const current = workflowGraph[path[i]];
    const next = path[i + 1];
    if (!current || !current.next.includes(next)) {
      return false;
    }
  }

  return true;
}

export async function executeWorkflow(input: Record<string, unknown>): Promise<WorkflowContext> {
  const context: WorkflowContext = {
    steps: [],
    currentStep: 0,
    data: { ...input }
  };

  try {
    const path = ['start', 'researchCompany', 'qualifyLead', 'end'];
    if (!validateWorkflowPath(path)) {
      throw new Error('Invalid workflow path');
    }

    for (const stepId of path) {
      if (stepId === 'start' || stepId === 'end') continue;
      
      const step: WorkflowStep = {
        id: stepId,
        type: 'analysis',
        status: 'running'
      };
      
      context.steps.push(step);
      context.currentStep++;
    }

    return context;
  } catch (err) {
    const error = err as WorkflowError;
    logger.error('Error in workflow execution', { 
      error: error.message,
      code: error.code,
      details: error.details 
    });
    throw error;
  }
}

export async function validateWorkflow(context: WorkflowContext): Promise<boolean> {
  try {
    return context.steps.every(step => step.status === 'completed');
  } catch (err) {
    const error = err as WorkflowError;
    logger.error('Error in workflow validation', { 
      error: error.message,
      code: error.code,
      details: error.details 
    });
    throw error;
  }
}

export async function qualifyLead(lead: Lead): Promise<LeadQualificationResult> {
  const startTime = Date.now();
  
  try {
    const qualifiedLead = await qualifyLeadWithWorkflow(lead);
    const result: LeadQualificationResult = {
      lead: qualifiedLead,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      model: 'gpt-4',
      version: '1.0.0'
    };

    return result;
  } catch (error) {
    logger.error('Error qualifying lead', { error, lead });
    throw error;
  }
} 