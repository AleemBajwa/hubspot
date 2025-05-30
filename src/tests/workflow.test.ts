import { qualifyLeadWithWorkflow, qualifyLeadsWithWorkflow } from '../lib/ai/workflow';
import { Lead } from '../types/lead';

describe('Lead Qualification Workflow', () => {
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

  describe('qualifyLeadWithWorkflow', () => {
    it('should qualify a single lead with all required fields', async () => {
      const result = await qualifyLeadWithWorkflow(mockLead);
      
      expect(result).toMatchObject({
        ...mockLead,
        status: 'qualified',
        score: expect.any(Number),
        metadata: {
          qualification: {
            reason: expect.any(String),
            confidence: expect.any(Number),
            criteria: expect.any(Array)
          }
        }
      });

      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
      
      const qualification = (result.metadata as { qualification: { confidence: number } }).qualification;
      expect(qualification.confidence).toBeGreaterThanOrEqual(0);
      expect(qualification.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle leads with minimal required fields', async () => {
      const minimalLead: Lead = {
        id: 'test-2',
        company: 'Startup Inc',
        contact: {
          name: 'Jane Smith',
          title: 'CEO',
          email: 'jane.smith@example.com'
        },
        source: 'test',
        status: 'new',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await qualifyLeadWithWorkflow(minimalLead);
      
      expect(result).toMatchObject({
        ...minimalLead,
        status: 'qualified',
        score: expect.any(Number),
        metadata: {
          qualification: {
            reason: expect.any(String),
            confidence: expect.any(Number),
            criteria: expect.any(Array)
          }
        }
      });
    });

    it('should handle errors gracefully', async () => {
      const invalidLead: Lead = {
        ...mockLead,
        company: ''
      };
      
      const result = await qualifyLeadWithWorkflow(invalidLead);
      
      expect(result).toMatchObject({
        ...invalidLead,
        status: 'disqualified',
        score: 1,
        metadata: {
          qualification: {
            reason: expect.stringContaining('Error'),
            confidence: 0,
            criteria: expect.any(Array)
          }
        }
      });
    });
  });

  describe('qualifyLeadsWithWorkflow', () => {
    it('should qualify multiple leads in parallel', async () => {
      const leads: Lead[] = [
        mockLead,
        {
          ...mockLead,
          id: 'test-3',
          contact: {
            ...mockLead.contact,
            name: 'Jane Doe',
            email: 'jane@example.com'
          }
        },
        {
          ...mockLead,
          id: 'test-4',
          contact: {
            ...mockLead.contact,
            name: 'Bob Smith',
            email: 'bob@example.com'
          }
        }
      ];

      const results = await qualifyLeadsWithWorkflow(leads);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toMatchObject({
          status: 'qualified',
          score: expect.any(Number),
          metadata: {
            qualification: {
              reason: expect.any(String),
              confidence: expect.any(Number),
              criteria: expect.any(Array)
            }
          }
        });
      });
    });

    it('should handle empty lead array', async () => {
      const results = await qualifyLeadsWithWorkflow([]);
      expect(results).toHaveLength(0);
    });

    it('should process leads with mixed validity', async () => {
      const mixedLeads: Lead[] = [
        mockLead,
        {
          ...mockLead,
          id: 'test-5',
          company: '',
          contact: {
            ...mockLead.contact,
            email: ''
          }
        },
        {
          ...mockLead,
          id: 'test-6',
          contact: {
            ...mockLead.contact,
            email: 'valid@example.com'
          }
        }
      ];

      const results = await qualifyLeadsWithWorkflow(mixedLeads);
      
      expect(results).toHaveLength(3);
      expect(results.some(r => r.score === 1)).toBe(true);
      expect(results.some(r => r.score > 1)).toBe(true);
    });
  });
}); 