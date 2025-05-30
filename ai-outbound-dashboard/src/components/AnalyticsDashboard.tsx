"use client";
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalLeadsUploaded: number;
  totalQualified: number;
  totalSynced: number;
  funnel: { name: string; leads: number; qualified: number; synced: number }[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  leads: number;
  conversions: number;
}

interface CampaignAnalytics {
  emailDeliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  responseRate: number;
  leadQualificationSuccess: number;
  campaignROI: number;
  conversionRate: number;
  funnel: { stage: string; count: number }[];
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  enrolled: number;
  completed: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [campaignAnalyticsLoading, setCampaignAnalyticsLoading] = useState(true);
  const [campaignAnalyticsError, setCampaignAnalyticsError] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [workflowsError, setWorkflowsError] = useState<string | null>(null);

  // Fetch initial analytics data
  useEffect(() => {
    setLoading(true);
    fetch('/api/analytics/summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000; // Start with 1 second

    function connect() {
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/analytics/ws`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setLive(true);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setData(update);
          setLive(true);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setLive(false);
        ws = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws?.close();
      };
    }

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  useEffect(() => {
    setCampaignsLoading(true);
    fetch('/api/hubspot/campaigns')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        return res.json();
      })
      .then((json) => {
        setCampaigns(json.campaigns);
        setCampaignsError(null);
      })
      .catch((err) => {
        setCampaignsError(err.message);
        setCampaigns(null);
      })
      .finally(() => setCampaignsLoading(false));
  }, []);

  useEffect(() => {
    setCampaignAnalyticsLoading(true);
    fetch('/api/hubspot/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch campaign analytics');
        return res.json();
      })
      .then((json) => {
        setCampaignAnalytics(json);
        setCampaignAnalyticsError(null);
      })
      .catch((err) => {
        setCampaignAnalyticsError(err.message);
        setCampaignAnalytics(null);
      })
      .finally(() => setCampaignAnalyticsLoading(false));
  }, []);

  useEffect(() => {
    setWorkflowsLoading(true);
    fetch('/api/hubspot/workflows')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch workflows');
        return res.json();
      })
      .then((json) => {
        setWorkflows(json.workflows);
        setWorkflowsError(null);
      })
      .catch((err) => {
        setWorkflowsError(err.message);
        setWorkflows(null);
      })
      .finally(() => setWorkflowsLoading(false));
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Analytics Dashboard
        {live && <span className="ml-2 px-2 py-1 text-xs bg-green-200 text-green-800 rounded animate-pulse">Live</span>}
      </h2>
      {loading && <div className="mb-8 text-gray-500">Loading analytics...</div>}
      {error && <div className="mb-8 text-red-600">Error: {error}</div>}
      {data && (
        <>
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Key Metrics</h3>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <li className="bg-gray-100 p-4 rounded">
                <div className="text-lg font-bold">{data.totalLeadsUploaded}</div>
                <div className="text-xs text-gray-600">Total Leads Uploaded</div>
              </li>
              <li className="bg-gray-100 p-4 rounded">
                <div className="text-lg font-bold">{data.totalQualified}</div>
                <div className="text-xs text-gray-600">Qualified Leads</div>
              </li>
              <li className="bg-gray-100 p-4 rounded">
                <div className="text-lg font-bold">{data.totalSynced}</div>
                <div className="text-xs text-gray-600">Synced to HubSpot</div>
              </li>
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Lead Funnel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.funnel} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#8884d8" name="Leads Uploaded" />
                <Line type="monotone" dataKey="qualified" stroke="#82ca9d" name="Qualified" />
                <Line type="monotone" dataKey="synced" stroke="#ff7300" name="Synced" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Campaigns</h3>
        {campaignsLoading && <div className="text-gray-500">Loading campaigns...</div>}
        {campaignsError && <div className="text-red-600">Error: {campaignsError}</div>}
        {campaigns && (
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Leads</th>
                <th className="border px-2 py-1">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="border px-2 py-1">{c.name}</td>
                  <td className="border px-2 py-1">{c.status}</td>
                  <td className="border px-2 py-1">{c.leads}</td>
                  <td className="border px-2 py-1">{c.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Campaign Analytics</h3>
        {campaignAnalyticsLoading && <div className="text-gray-500">Loading campaign analytics...</div>}
        {campaignAnalyticsError && <div className="text-red-600">Error: {campaignAnalyticsError}</div>}
        {campaignAnalytics && (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.emailDeliveryRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Email Delivery Rate</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.openRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Open Rate</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.clickThroughRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Click-Through Rate</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.responseRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Response Rate</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.leadQualificationSuccess * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Lead Qualification Success</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{campaignAnalytics.campaignROI.toFixed(2)}x</div>
              <div className="text-xs text-gray-600">Campaign ROI</div>
            </li>
            <li className="bg-gray-100 p-4 rounded">
              <div className="text-lg font-bold">{(campaignAnalytics.conversionRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Conversion Rate</div>
            </li>
          </ul>
        )}
      </div>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Workflows</h3>
        {workflowsLoading && <div className="text-gray-500">Loading workflows...</div>}
        {workflowsError && <div className="text-red-600">Error: {workflowsError}</div>}
        {workflows && (
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Enrolled</th>
                <th className="border px-2 py-1">Completed</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w) => (
                <tr key={w.id}>
                  <td className="border px-2 py-1">{w.name}</td>
                  <td className="border px-2 py-1">{w.status}</td>
                  <td className="border px-2 py-1">{w.enrolled}</td>
                  <td className="border px-2 py-1">{w.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div>
        <h3 className="font-semibold mb-2">Dashboard Sections (Planned)</h3>
        <ol className="list-decimal ml-6 text-sm text-gray-700">
          <li>Overview Cards - Key performance indicators</li>
          <li>Lead Quality Metrics - Qualification score distribution</li>
          <li>Campaign Performance - Email metrics and engagement</li>
          <li>Conversion Funnel - Lead progression tracking</li>
          <li>Time-based Analytics - Trend analysis and forecasting</li>
        </ol>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 