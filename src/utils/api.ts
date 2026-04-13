// All paths are relative — proxied by Vite to http://103.249.82.251:8002

export async function apiPost<T = unknown>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = params
    ? `${path}?${new URLSearchParams(params as Record<string, string>).toString()}`
    : path;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export async function apiPut<T = unknown>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}


export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(path, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data as T;
}
