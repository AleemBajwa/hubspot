import { NextRequest } from 'next/server';
import { POST as qualifyLeads } from '../app/api/leads/qualify/route';
import { POST as syncToHubspot } from '../../ai-outbound-dashboard/src/app/api/hubspot/contacts';
import { Lead } from '../types/lead';

describe('API Endpoints', () => {
  const mockLead: Lead = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Tech Corp',
    title: 'CTO'
  };

  describe('POST /api/leads/qualify', () => {
    it('should qualify valid leads', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads/qualify', {
        method: 'POST',
        body: JSON.stringify([mockLead])
      });

      const response = await qualifyLeads(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.qualifiedLeads).toHaveLength(1);
      expect(data.qualifiedLeads[0]).toMatchObject({
        ...mockLead,
        qualificationScore: expect.any(Number),
        qualificationReason: expect.any(String),
        confidenceLevel: expect.any(Number)
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
        body: JSON.stringify([])
      });

      const response = await qualifyLeads(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/hubspot/contacts', () => {
    const qualifiedLead = {
      ...mockLead,
      qualificationScore: 8,
      qualificationReason: 'High potential lead',
      confidenceLevel: 0.9,
      qualifiedAt: new Date(),
      processingTime: 1000
    };

    it('should sync qualified leads to HubSpot', async () => {
      const req = new NextRequest('http://localhost:3000/api/hubspot/contacts', {
        method: 'POST',
        body: JSON.stringify([qualifiedLead])
      });

      const response = await syncToHubspot(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toMatchObject({
        email: qualifiedLead.email,
        status: expect.any(String)
      });
    });

    it('should handle leads below qualification threshold', async () => {
      const lowScoreLead = {
        ...qualifiedLead,
        qualificationScore: 5,
        email: 'lowscore@example.com'
      };

      const req = new NextRequest('http://localhost:3000/api/hubspot/contacts', {
        method: 'POST',
        body: JSON.stringify([lowScoreLead])
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