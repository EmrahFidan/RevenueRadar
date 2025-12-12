const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://revenueradar-production.up.railway.app';

// Score breakdown from hybrid scoring system
export interface ScoreBreakdown {
  company_size: number;
  engagement: number;
  budget_fit: number;
  decision_authority: number;
  timeline: number;
  data_quality: number;
  behavioral: number;
}

// Lead data from Excel file
export interface LeadData {
  company_name: string;
  industry: string;
  country: string;
  city: string;
  employee_count: number;
  annual_revenue_usd: number;
  contact_name: string;
  contact_email: string;
  job_title: string;
  decision_authority: string;
  lead_source: string;
  budget_range: string;
  purchase_timeline: string;
  website_visits: number;
  emails_opened: number;
  content_downloads: number;
  demo_requested: boolean;
  free_trial_signup: boolean;
  current_solution: string;
  pain_points: string;
}

// Lead analysis result from hybrid scoring
export interface LeadAnalysis {
  customer_name: string;
  score: number;
  rule_based_score: number;
  ai_adjustment: number;
  reason: string;
  actions: string[];
  score_breakdown: ScoreBreakdown;
  lead_data: LeadData;
}

export interface AnalyzeResponse {
  results: LeadAnalysis[];
  total_leads: number;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface BulkEmailRequest {
  leads: Array<{
    customer_name: string;
    company: string;
    reason: string;
  }>;
}

export interface BulkEmailResponse {
  emails: Array<{
    customer_name: string;
    subject: string;
    body: string;
  }>;
}

export interface CRMExportRequest {
  results: LeadAnalysis[];
  crm_type: 'hubspot' | 'salesforce';
}

export interface CRMExportResponse {
  success: boolean;
  message: string;
  records: number;
  data: Record<string, unknown>[];
}

// Analyze leads from uploaded file
export async function analyzeFile(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.detail || 'An error occurred during analysis');
    } catch {
      throw new Error('An error occurred during analysis');
    }
  }

  return response.json();
}

// Generate email draft for a single lead
export async function draftEmail(
  customerName: string,
  company: string = '',
  reason: string = ''
): Promise<EmailDraft> {
  const params = new URLSearchParams({
    customer_name: customerName,
    company,
    reason,
  });

  const response = await fetch(`${API_BASE_URL}/draft-email?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate email draft');
    } catch {
      throw new Error('Failed to generate email draft');
    }
  }

  return response.json();
}

// Generate bulk email drafts for multiple leads
export async function draftBulkEmails(
  leads: BulkEmailRequest['leads']
): Promise<BulkEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/draft-bulk-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leads }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate bulk email drafts');
  }

  return response.json();
}

// Export results to Excel file
export async function exportToExcel(results: LeadAnalysis[]): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/export-excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ results }),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to export to Excel');
    } catch {
      throw new Error('Failed to export to Excel');
    }
  }

  return response.blob();
}

// Export to CRM (HubSpot or Salesforce)
export async function exportToCRM(
  results: LeadAnalysis[],
  crmType: 'hubspot' | 'salesforce'
): Promise<CRMExportResponse> {
  const response = await fetch(`${API_BASE_URL}/export-crm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ results, crm_type: crmType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export to CRM');
  }

  return response.json();
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
