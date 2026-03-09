export interface CollectRegulationsRequest {
  query: string;
  max_results: number;
}

export interface CollectRegulationsResponse {
  discovered_pdf_urls: number;
  downloaded_pdfs: number;
  ingested_chunks: number;
  tavily_documents_ingested: number;
  local_documents_ingested: number;
  sources: string[];
}

export interface StrategyRequest {
  business_idea: string;
  market_focus: string;
}

export interface StrategyPayload {
  key_regulations: string[];
  business_opportunities: string[];
  marketing_strategy: string[];
  compliance_checklist: string[];
  implementation_roadmap: string[];
}

export interface StrategyResponse {
  query: string;
  rewritten_query: string;
  strategy: StrategyPayload;
  retrieved_sources: string[];
  pdf_report: string;
}

const RAW_API_BASE_URL =
  import.meta.env.VITE_STRATEGY_API_BASE_URL ||
  (import.meta.env.PROD ? '/api/ai/internal' : 'http://localhost:8000/api/ai/internal');
const ACCESS_STORAGE_KEY = 'eu_strategy_access_password';

function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (normalized === '/ai/internal' || normalized.startsWith('/ai/internal/')) {
    return `/api${normalized}`;
  }
  return normalized;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

let runtimeAccessPassword =
  typeof window !== 'undefined' ? window.sessionStorage.getItem(ACCESS_STORAGE_KEY) || '' : '';

function joinUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const endpoint = path.replace(/^\/+/, '');
  return `${base}/${endpoint}`;
}

function getEffectivePassword(): string {
  return runtimeAccessPassword;
}

function buildHeaders(withJson = true): HeadersInit {
  const headers: HeadersInit = {};

  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }

  const password = getEffectivePassword();
  if (password) {
    headers['X-App-Password'] = password;
  }

  return headers;
}

export function isEuStrategyUnlocked(): boolean {
  return Boolean(getEffectivePassword());
}

export function setEuStrategyAccessPassword(password: string): void {
  runtimeAccessPassword = password.trim();
  if (typeof window === 'undefined') {
    return;
  }

  if (runtimeAccessPassword) {
    window.sessionStorage.setItem(ACCESS_STORAGE_KEY, runtimeAccessPassword);
  } else {
    window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  }
}

export async function validateEuStrategyPassword(password: string): Promise<boolean> {
  const response = await fetch(joinUrl('/access-check'), {
    method: 'GET',
    headers: {
      'X-App-Password': password.trim(),
    },
  });

  if (!response.ok) {
    return false;
  }

  setEuStrategyAccessPassword(password);
  return true;
}

async function postJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(joinUrl(path), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export function collectRegulations(
  payload: CollectRegulationsRequest,
): Promise<CollectRegulationsResponse> {
  return postJson<CollectRegulationsResponse, CollectRegulationsRequest>('/collect-regulations', payload);
}

export function generateStrategy(payload: StrategyRequest): Promise<StrategyResponse> {
  return postJson<StrategyResponse, StrategyRequest>('/generate-strategy', payload);
}

export function resolveReportUrl(pdfReport: string): string {
  if (!pdfReport) {
    return '';
  }
  if (pdfReport.startsWith('http://') || pdfReport.startsWith('https://')) {
    return pdfReport;
  }

  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return new URL(pdfReport, API_BASE_URL).toString();
  }

  return pdfReport;
}

export function getAuthorizedFetchHeaders(): HeadersInit {
  return buildHeaders(false);
}
