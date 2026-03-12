const BASE_URL = 'http://localhost:5000';

export async function apiFetch(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
}

export async function apiPost(endpoint: string, body: any) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut(endpoint: string, body: any) {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string, body: any = {}) {
    if (Object.keys(body).length > 0) {
        return apiFetch(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(body),
        });
    }
  return apiFetch(endpoint, {
    method: 'DELETE',
  });
}

export async function apiGet(endpoint: string, params: any = {}) {
  const query = new URLSearchParams(params).toString();
  const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
  return apiFetch(fullEndpoint, {
    method: 'GET',
  });
}

export async function apiUpload(endpoint: string, formData: FormData) {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Upload failed');
  }

  return response.json();
}
