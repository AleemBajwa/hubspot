"use client";

import React from 'react';
import LeadUploadForm from "../../../ai-outbound-dashboard/src/components/LeadUploadForm";

export default function LeadsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lead Management</h1>
      <LeadUploadForm />
    </div>
  );
} 