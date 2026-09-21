export async function invokeApi<T>(endpoint: string, payload: any): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dkasigma_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.token) headers['authorization'] = `Bearer ${session.token}`;
      }
    } catch {}
  }
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${res.status}`);
  }
  return res.json();
}
