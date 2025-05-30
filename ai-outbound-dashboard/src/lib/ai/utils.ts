import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { model } from './config';

// Utility function to extract key insights from lead data
export const extractLeadInsights = async (leadData: any) => {
  const insightPrompt = PromptTemplate.fromTemplate(`
  Analyze the following lead data and extract key insights:
  {leadData}
  
  Focus on:
  1. Company information
  2. Decision maker details
  3. Potential pain points
  4. Engagement opportunities
  
  Format the response as a JSON object with these categories.
  `);

  const chain = RunnableSequence.from([
    insightPrompt,
    model,
  ]);

  const result = await chain.invoke({
    leadData: JSON.stringify(leadData),
  });

  return JSON.parse(typeof result.content === "string" ? result.content : JSON.stringify(result.content));
};

// Utility function to generate personalized message content
export const generatePersonalizedMessage = async (
  leadData: any,
  messageType: 'initial' | 'follow-up' | 'nurture',
  context?: string
) => {
  const messagePrompt = PromptTemplate.fromTemplate(`
  Generate a personalized ${messageType} message for the following lead:
  Lead Data: {leadData}
  Context: {context}
  
  Requirements:
  1. Professional and engaging tone
  2. Personalized to the lead's industry and role
  3. Clear value proposition
  4. Specific call to action
  5. Keep it concise (max 3 paragraphs)
  
  Format the response as a JSON object with:
  {
    "subject": "email subject line",
    "body": "message body",
    "callToAction": "specific CTA"
  }
  `);

  const chain = RunnableSequence.from([
    messagePrompt,
    model,
  ]);

  const result = await chain.invoke({
    leadData: JSON.stringify(leadData),
    context: context || 'No additional context provided',
  });

  return JSON.parse(typeof result.content === "string" ? result.content : JSON.stringify(result.content));
};

// Utility function to score lead quality
export const scoreLeadQuality = async (leadData: any) => {
  const scoringPrompt = PromptTemplate.fromTemplate(`
  Score the following lead's quality based on available data:
  {leadData}
  
  Consider:
  1. Company size and industry
  2. Decision maker role and seniority
  3. Contact information completeness
  4. Engagement potential
  5. Historical interaction (if any)
  
  Provide a score from 0-100 and detailed reasoning.
  Format as JSON:
  {
    "score": number,
    "reasoning": string,
    "recommendations": string[]
  }
  `);

  const chain = RunnableSequence.from([
    scoringPrompt,
    model,
  ]);

  const result = await chain.invoke({
    leadData: JSON.stringify(leadData),
  });

  return JSON.parse(typeof result.content === "string" ? result.content : JSON.stringify(result.content));
};

// Utility function to predict optimal contact timing
export const predictContactTiming = async (leadData: any, historicalData?: any) => {
  const timingPrompt = PromptTemplate.fromTemplate(`
  Based on the following data, predict the optimal contact timing:
  Lead Data: {leadData}
  Historical Data: {historicalData}
  
  Consider:
  1. Industry patterns
  2. Time zones
  3. Previous engagement attempts
  4. Best practices for similar leads
  
  Provide specific recommendations for:
  1. Best day of week
  2. Best time of day
  3. Frequency of follow-ups
  4. Preferred communication channels
  
  Format as JSON object with these categories.
  `);

  const chain = RunnableSequence.from([
    timingPrompt,
    model,
  ]);

  const result = await chain.invoke({
    leadData: JSON.stringify(leadData),
    historicalData: historicalData ? JSON.stringify(historicalData) : 'No historical data available',
  });

  return JSON.parse(typeof result.content === "string" ? result.content : JSON.stringify(result.content));
}; 