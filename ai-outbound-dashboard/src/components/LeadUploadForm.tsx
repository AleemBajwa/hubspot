"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { Lead, QualifiedLead } from '../types/lead';

interface CsvError {
  row: number;
  message: string;
}

const requiredFields = [
  'firstName',
  'lastName',
  'email',
  'company',
  'title',
];

function validateLead(lead: any, row: number): CsvError[] {
  const errors: CsvError[] = [];
  requiredFields.forEach((field) => {
    if (!lead[field]) {
      errors.push({ row, message: `Missing required field: ${field}` });
    }
  });
  // Add more validation as needed
  return errors;
}

export const LeadUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[] | null>(null);
  const [qualifyLoading, setQualifyLoading] = useState(false);
  const [qualifyError, setQualifyError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setApiResult(null);
    setApiError(null);
    setQualifiedLeads(null);
    setQualifyError(null);
    setSyncResult(null);
    setSyncError(null);
    const file = acceptedFiles[0];
    setFile(file);
    setFileName(file.name);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setApiResult(null);
    setApiError(null);
    setQualifiedLeads(null);
    setQualifyError(null);
    setSyncResult(null);
    setSyncError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      setApiResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleQualify = async () => {
    if (!apiResult || !apiResult.validLeads || apiResult.validLeads.length === 0) return;
    setQualifyLoading(true);
    setQualifyError(null);
    setQualifiedLeads(null);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiResult.validLeads),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Qualification API error');
      setQualifiedLeads(data.qualifiedLeads);
    } catch (err: any) {
      setQualifyError(err.message || 'Unknown error');
    } finally {
      setQualifyLoading(false);
    }
  };

  const handleSync = async () => {
    if (!qualifiedLeads || qualifiedLeads.length === 0) return;
    setSyncLoading(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/hubspot/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qualifiedLeads),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HubSpot sync error');
      setSyncResult(data.results);
    } catch (err: any) {
      setSyncError(err.message || 'Unknown error');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Upload Leads (CSV)</h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here ...</p>
        ) : (
          <p>Drag 'n' drop a CSV file here, or click to select file</p>
        )}
        {fileName && <p className="mt-2 text-sm text-gray-500">Selected file: {fileName}</p>}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Uploading...' : 'Upload & Validate'}
      </button>
      {apiError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{apiError}</div>
      )}
      {apiResult && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Upload Preview ({apiResult.previewCount} rows):</h3>
          {apiResult.invalidLeads.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              <strong>Invalid Leads:</strong>
              <ul className="list-disc ml-5">
                {apiResult.invalidLeads.map((err: any, idx: number) => (
                  <li key={idx}>Row {err.index + 2}: {err.errors.join(', ')}</li>
                ))}
              </ul>
            </div>
          )}
          {apiResult.validLeads.length > 0 && (
            <div className="mb-4">
              <strong>Valid Leads ({apiResult.validLeads.length}):</strong>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">First Name</th>
                      <th className="border px-2 py-1">Last Name</th>
                      <th className="border px-2 py-1">Email</th>
                      <th className="border px-2 py-1">Company</th>
                      <th className="border px-2 py-1">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiResult.validLeads.slice(0, 10).map((lead: Lead, idx: number) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{lead.firstName}</td>
                        <td className="border px-2 py-1">{lead.lastName}</td>
                        <td className="border px-2 py-1">{lead.email}</td>
                        <td className="border px-2 py-1">{lead.company}</td>
                        <td className="border px-2 py-1">{lead.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {apiResult.validLeads.length > 10 && (
                  <p className="text-xs text-gray-500 mt-1">Showing first 10 of {apiResult.validLeads.length} valid leads.</p>
                )}
              </div>
              <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={handleQualify}
                disabled={qualifyLoading || apiResult.validLeads.length === 0}
              >
                {qualifyLoading ? 'Qualifying...' : 'Qualify Valid Leads'}
              </button>
              {qualifyError && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">{qualifyError}</div>
              )}
            </div>
          )}
        </div>
      )}
      {qualifiedLeads && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Qualified Leads ({qualifiedLeads.length}):</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">First Name</th>
                  <th className="border px-2 py-1">Last Name</th>
                  <th className="border px-2 py-1">Email</th>
                  <th className="border px-2 py-1">Company</th>
                  <th className="border px-2 py-1">Score</th>
                  <th className="border px-2 py-1">Reason</th>
                </tr>
              </thead>
              <tbody>
                {qualifiedLeads.slice(0, 10).map((lead, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{lead.firstName}</td>
                    <td className="border px-2 py-1">{lead.lastName}</td>
                    <td className="border px-2 py-1">{lead.email}</td>
                    <td className="border px-2 py-1">{lead.company}</td>
                    <td className="border px-2 py-1">{lead.qualificationScore}</td>
                    <td className="border px-2 py-1">{lead.qualificationReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {qualifiedLeads.length > 10 && (
              <p className="text-xs text-gray-500 mt-1">Showing first 10 of {qualifiedLeads.length} qualified leads.</p>
            )}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-50"
            onClick={handleSync}
            disabled={syncLoading || qualifiedLeads.length === 0}
          >
            {syncLoading ? 'Syncing to HubSpot...' : 'Sync Qualified Leads to HubSpot'}
          </button>
          {syncError && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">{syncError}</div>
          )}
          {syncResult && (
            <div className="mt-2 p-2 bg-green-100 text-green-700 rounded">{syncResult}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadUploadForm; 