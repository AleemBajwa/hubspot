import { qualifyLeadWithWorkflow, qualifyLeadsWithWorkflow } from '../lib/ai/workflow';
import { Lead } from '../types/lead';

describe('Lead Qualification Workflow', () => {
  const mockLead: Lead = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Tech Corp',
    title: 'CTO',
    phone: '+1234567890',
    website: 'https://techcorp.com',
    industry: 'Technology',
    companySize: '51-200',
    location: 'San Francisco, CA'
  };

  describe('qualifyLeadWithWorkflow', () => {
    it('should qualify a single lead with all required fields', async () => {
      const result = await qualifyLeadWithWorkflow(mockLead);
      
      expect(result).toMatchObject({
        ...mockLead,
        qualificationScore: expect.any(Number),
        qualificationReason: expect.any(String),
        confidenceLevel: expect.any(Number),
        qualifiedAt: expect.any(Date),
        processingTime: expect.any(Number)
      });

      expect(result.qualificationScore).toBeWithinRange(1, 10);
      expect(result.confidenceLevel).toBeWithinRange(0, 1);
    });

    it('should handle leads with minimal required fields', async () => {
      const minimalLead: Lead = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        company: 'Startup Inc',
        title: 'CEO'
      };

      const result = await qualifyLeadWithWorkflow(minimalLead);
      
      expect(result).toMatchObject({
        ...minimalLead,
        qualificationScore: expect.any(Number),
        qualificationReason: expect.any(String),
        confidenceLevel: expect.any(Number)
      });
    });

    it('should handle errors gracefully', async () => {
      const invalidLead = { ...mockLead, company: '' };
      
      const result = await qualifyLeadWithWorkflow(invalidLead as Lead);
      
      expect(result).toMatchObject({
        ...invalidLead,
        qualificationScore: 1,
        confidenceLevel: 0,
        qualificationReason: expect.stringContaining('Error')
      });
    });
  });

  describe('qualifyLeadsWithWorkflow', () => {
    it('should qualify multiple leads in parallel', async () => {
      const leads = [
        mockLead,
        { ...mockLead, email: 'jane@example.com', firstName: 'Jane' },
        { ...mockLead, email: 'bob@example.com', firstName: 'Bob' }
      ];

      const results = await qualifyLeadsWithWorkflow(leads);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toMatchObject({
          qualificationScore: expect.any(Number),
          qualificationReason: expect.any(String),
          confidenceLevel: expect.any(Number)
        });
      });
    });

    it('should handle empty lead array', async () => {
      const results = await qualifyLeadsWithWorkflow([]);
      expect(results).toHaveLength(0);
    });

    it('should process leads with mixed validity', async () => {
      const mixedLeads = [
        mockLead,
        { ...mockLead, email: '', company: '' } as Lead,
        { ...mockLead, email: 'valid@example.com' }
      ];

      const results = await qualifyLeadsWithWorkflow(mixedLeads);
      
      expect(results).toHaveLength(3);
      expect(results.some(r => r.qualificationScore === 1)).toBe(true);
      expect(results.some(r => r.qualificationScore > 1)).toBe(true);
    });
  });
}); 