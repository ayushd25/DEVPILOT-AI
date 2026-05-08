const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export async function fetchApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Cannot connect to backend at ${API_URL}. Is the server running?`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Server Error: ${res.status}`);
  }

  return data;
}

export const api = {
  getSettings: () => fetchApi('/api/settings'),
  saveSettings: (data: any) => fetchApi('/api/settings', { method: 'POST', body: JSON.stringify(data) }),
  testConnection: () => fetchApi('/api/test-connection', { method: 'POST' }),
  getIssues: () => fetchApi('/api/issues'),
  getModels: () => fetchApi('/api/llm/models'),
  getIndexStatus: () => fetchApi('/api/repo/index-status'),
  startIndexing: () => fetchApi('/api/repo/index', { method: 'POST' }),
  solveIssue: (number: number) => fetchApi(`/api/solve/${number}`, { method: 'POST' }),
  getSession: (id: string) => fetchApi(`/api/sessions/${id}`),
  getSessions: () => fetchApi('/api/sessions'),
};