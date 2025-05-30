import { NextRequest, NextResponse } from 'next/server';

const hubspotApiKey = process.env.HUBSPOT_API_KEY;

interface HubSpotWorkflow {
  id: string;
  name: string;
  status: string;
  type: string;
  enrollmentCount: number;
  completionCount: number;
  lastUpdated: string;
}

interface HubSpotWorkflowsResponse {
  results: HubSpotWorkflow[];
  total: number;
  paging?: {
    next?: {
      after: string;
    };
  };
}

export async function GET(req: NextRequest) {
  if (!hubspotApiKey) {
    return NextResponse.json({ error: 'HubSpot API key not configured' }, { status: 401 });
  }

  try {
    // Fetch workflows using the workflows API
    const workflowsResponse = await fetch(
      'https://api.hubapi.com/automation/v3/workflows',
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!workflowsResponse.ok) {
      throw new Error(`Failed to fetch workflows: ${workflowsResponse.statusText}`);
    }

    const workflowsData: HubSpotWorkflowsResponse = await workflowsResponse.json();

    // Fetch enrollment and completion data for each workflow
    const workflowsWithMetrics = await Promise.all(
      workflowsData.results.map(async (workflow: HubSpotWorkflow) => {
        try {
          // Fetch workflow enrollment metrics
          const enrollmentResponse = await fetch(
            `https://api.hubapi.com/automation/v3/workflows/${workflow.id}/enrollments`,
            {
              headers: {
                Authorization: `Bearer ${hubspotApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!enrollmentResponse.ok) {
            throw new Error(`Failed to fetch workflow enrollments: ${enrollmentResponse.statusText}`);
          }

          const enrollmentData = await enrollmentResponse.json();

          // Fetch workflow completion metrics
          const completionResponse = await fetch(
            `https://api.hubapi.com/automation/v3/workflows/${workflow.id}/completions`,
            {
              headers: {
                Authorization: `Bearer ${hubspotApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!completionResponse.ok) {
            throw new Error(`Failed to fetch workflow completions: ${completionResponse.statusText}`);
          }

          const completionData = await completionResponse.json();

          return {
            id: workflow.id,
            name: workflow.name,
            status: workflow.status,
            type: workflow.type,
            enrolled: enrollmentData.total || 0,
            completed: completionData.total || 0,
            metrics: {
              activeEnrollments: enrollmentData.active || 0,
              completedEnrollments: completionData.completed || 0,
              completionRate: completionData.total && enrollmentData.total
                ? (completionData.total / enrollmentData.total) * 100
                : 0,
              averageTimeToComplete: completionData.averageTimeToComplete || 0,
            },
            lastUpdated: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`Error fetching metrics for workflow ${workflow.id}:`, err);
          return {
            id: workflow.id,
            name: workflow.name,
            status: workflow.status,
            type: workflow.type,
            enrolled: 0,
            completed: 0,
            metrics: {
              activeEnrollments: 0,
              completedEnrollments: 0,
              completionRate: 0,
              averageTimeToComplete: 0,
            },
            error: 'Failed to fetch workflow metrics',
            lastUpdated: new Date().toISOString(),
          };
        }
      })
    );

    return NextResponse.json({
      workflows: workflowsWithMetrics,
      total: workflowsData.total,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('HubSpot workflows error:', err);
    // Fallback to simulated data on error
    const workflows = [
      {
        id: 'wf-1',
        name: 'Welcome Sequence',
        status: 'active',
        type: 'contact',
        enrolled: 45,
        completed: 30,
        metrics: {
          activeEnrollments: 15,
          completedEnrollments: 30,
          completionRate: 66.67,
          averageTimeToComplete: 48, // hours
        },
        error: err.message,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'wf-2',
        name: 'Nurture Series',
        status: 'paused',
        type: 'contact',
        enrolled: 20,
        completed: 10,
        metrics: {
          activeEnrollments: 10,
          completedEnrollments: 10,
          completionRate: 50.00,
          averageTimeToComplete: 72, // hours
        },
        error: err.message,
        lastUpdated: new Date().toISOString(),
      },
    ];
    return NextResponse.json({
      workflows,
      total: workflows.length,
      error: err.message,
      lastUpdated: new Date().toISOString(),
    });
  }
} 