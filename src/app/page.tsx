"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/summary');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.totalLeads}</p>
          <Link href="/leads" className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            View all leads →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Qualified Leads</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.qualifiedLeads}</p>
          <Link href="/analytics" className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            View qualification metrics →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics.activeCampaigns}</p>
          <Link href="/campaigns" className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            Manage campaigns →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(metrics.conversionRate * 100).toFixed(1)}%
          </p>
          <Link href="/analytics" className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            View detailed analytics →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/leads')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload New Leads
            </button>
            <button
              onClick={() => router.push('/campaigns/new')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create New Campaign
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              View Detailed Analytics
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 