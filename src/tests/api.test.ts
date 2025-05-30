import { NextRequest } from 'next/server';
import { POST as qualifyLeads } from '../app/api/leads/qualify/route';
import { POST as syncToHubspot } from '../../ai-outbound-dashboard/src/app/api/hubspot/contacts';
import { Lead } from '../types/lead';

describe('API Endpoints', () => {
  const mockLead: Lead = {
    id: 'test-1',
    company: 'Tech Corp',
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: '51-200',
    location: 'San Francisco, CA',
    contact: {
      name: 'John Doe',
      title: 'CTO',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      linkedin: 'https://linkedin.com/in/johndoe'
    },
    source: 'test',
    status: 'new',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('POST /api/leads/qualify', () => {
    it('should qualify valid leads', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/qualify', {
        method: 'POST',
        body: JSON.stringify({
          leads: [mockLead]
        })
      });

      const response = await qualifyLeads(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].lead).toMatchObject({
        ...mockLead,
        qualification: {
          reason: expect.any(String),
          confidence: expect.any(Number),
          criteria: expect.any(Array)
        }
      });
    });

    it('should handle invalid request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/qualify', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      });

      const response = await qualifyLeads(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle empty leads array', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/qualify', {
        method: 'POST',
        body: JSON.stringify({ leads: [] })
      });

      const response = await qualifyLeads(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/hubspot/contacts', () => {
    const qualifiedLead: Lead = {
      ...mockLead,
      status: 'qualified',
      score: 8,
      metadata: {
        qualification: {
          reason: 'High potential lead',
          confidence: 0.9,
          criteria: []
        }
      }
    };

    it('should sync qualified leads to HubSpot', async () => {
      const req = new NextRequest('http://localhost:3000/api/hubspot/contacts', {
        method: 'POST',
        body: JSON.stringify({ leads: [qualifiedLead] })
      });

      const response = await syncToHubspot(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toMatchObject({
        contact: {
          email: qualifiedLead.contact.email,
        status: expect.any(String)
        }
      });
    });

    it('should handle leads below qualification threshold', async () => {
      const lowScoreLead: Lead = {
        ...qualifiedLead,
        score: 5,
        contact: {
          ...qualifiedLead.contact,
        email: 'lowscore@example.com'
        }
      };

      const req = new NextRequest('http://localhost:3000/api/hubspot/contacts', {
        method: 'POST',
        body: JSON.stringify({ leads: [lowScoreLead] })
      });

      const response = await syncToHubspot(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].status).toBe('skipped');
      expect(data.results[0].reason).toBe('Score below threshold');
    });

    it('should handle invalid request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/hubspot/contacts', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      });

      const response = await syncToHubspot(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
}); 