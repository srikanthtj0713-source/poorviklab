// Service for Biological Reference Ranges and Interference info
// Uses local dataset first, then optional external API.
// Env vars: VITE_BIO_REF_API_URL, VITE_BIO_REF_API_KEY, VITE_BIO_REF_AUTH_HEADER
import localRef from "@/data/bio-ref.json";

export interface BioReferenceResponse {
  test: string;
  unit?: string;
  normalRange?: string;
  notes?: string[];
  interferences?: Array<{ name: string; effect?: string; note?: string }>;
  source?: string;
}

function getAuthHeader() {
  const header = import.meta.env.VITE_BIO_REF_AUTH_HEADER || 'Authorization';
  const key = import.meta.env.VITE_BIO_REF_API_KEY as string | undefined;
  if (!key) return {} as Record<string, string>;
  if (header.toLowerCase() === 'authorization') {
    return { Authorization: `Bearer ${key}` };
  }
  return { [header]: key } as Record<string, string>;
}

function getApiUrl(path: string) {
  const base = (import.meta.env.VITE_BIO_REF_API_URL as string | undefined) || '';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(getApiUrl(path));
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    throw new Error(`BioRef API error ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getBioReference(testName: string): Promise<BioReferenceResponse> {
  const local = getLocalBioRef(testName);
  if (local) return local;
  return request<BioReferenceResponse>('/reference', { test: testName });
}

export async function getInterferences(testName: string): Promise<BioReferenceResponse> {
  const local = getLocalBioRef(testName);
  if (local?.interferences || local?.notes) return local;
  return request<BioReferenceResponse>('/interference', { test: testName });
}

export async function getBioRefAndInterference(testName: string): Promise<BioReferenceResponse> {
  // Optional combined endpoint if the provider supports it; fallback to separate calls
  try {
    const local = getLocalBioRef(testName);
    if (local) return local;
    return await request<BioReferenceResponse>('/combined', { test: testName });
  } catch {
    const [ref] = await Promise.all([request<BioReferenceResponse>('/reference', { test: testName })]);
    try {
      const inf = await request<BioReferenceResponse>('/interference', { test: testName });
      return { ...ref, interferences: inf.interferences };
    } catch {
      return ref;
    }
  }
}

export function getLocalBioRef(testName: string): BioReferenceResponse | undefined {
  const entry = (localRef as Record<string, BioReferenceResponse | undefined>)[testName];
  return entry;
}
