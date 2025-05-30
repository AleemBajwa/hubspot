import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';

// Initialize the OpenAI model with configuration
export const model = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 1000,
});

// Base prompt template for lead analysis
export const leadAnalysisPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant specialized in analyzing sales leads and providing actionable insights.
Given the following lead information:
{leadData}

Please analyze and provide:
1. Lead quality assessment
2. Recommended next steps
3. Potential engagement strategies

Your response should be structured and concise.
`);

// Base prompt template for workflow recommendations
export const workflowRecommendationPrompt = PromptTemplate.fromTemplate(`
Based on the following lead profile and historical data:
{leadProfile}
{historicalData}

Recommend the most effective workflow sequence and messaging strategy.
Consider:
1. Lead stage and behavior
2. Previous engagement history
3. Industry context
4. Best practices for similar leads

Provide specific recommendations for:
1. Workflow selection
2. Message timing
3. Content personalization
4. Follow-up strategy
`);

// Export common runnable sequences
export const createAnalysisChain = () => {
  return RunnableSequence.from([
    leadAnalysisPrompt,
    model,
  ]);
};

export const createWorkflowRecommendationChain = () => {
  return RunnableSequence.from([
    workflowRecommendationPrompt,
    model,
  ]);
}; 