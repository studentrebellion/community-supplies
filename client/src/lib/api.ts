// API client — replaces @supabase/supabase-js

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

export function hasToken(): boolean {
  return !!localStorage.getItem('auth_token');
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ---- Auth ----
export const auth = {
  async signup(username: string, password: string, name: string, signalContact: string) {
    const data = await request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, signal_contact: signalContact }),
    });
    setToken(data.token);
    return data;
  },

  async login(username: string, password: string) {
    const data = await request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },

  async me() {
    return request<{ user: any }>('/auth/me');
  },

  logout() {
    clearToken();
    window.location.href = '/';
  },
};

// ---- Supplies ----
export const supplies = {
  async list() {
    return request<{ supplies: any[] }>('/supplies');
  },

  async my() {
    return request<{ supplies: any[] }>('/supplies/my');
  },

  async create(data: any) {
    return request<{ supply: any }>('/supplies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return request<{ supply: any }>(`/supplies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request(`/supplies/${id}`, { method: 'DELETE' });
  },
};

// ---- Books ----
export const books = {
  async list() {
    return request<{ books: any[] }>('/books');
  },

  async my() {
    return request<{ books: any[] }>('/books/my');
  },

  async create(booksData: any[]) {
    return request<{ books: any[] }>('/books', {
      method: 'POST',
      body: JSON.stringify({ books: booksData }),
    });
  },

  async update(id: string, data: any) {
    return request<{ book: any }>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request(`/books/${id}`, { method: 'DELETE' });
  },
};

// ---- Profiles ----
export const profiles = {
  async me() {
    return request<{ profile: any }>('/profiles/me');
  },

  async update(data: { name?: string; intro_text?: string; zip_code?: string; signal_contact?: string }) {
    return request<{ profile: any }>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getPublic(id: string) {
    return request<{ profile: any }>(`/profiles/${id}`);
  },
};

// ---- Join Requests ----
export const joinRequests = {
  async submit(data: any) {
    return request<{ request: any }>('/join-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async list() {
    return request<{ requests: any[] }>('/join-requests');
  },

  async vouch(id: string) {
    return request(`/join-requests/${id}/vouch`, { method: 'PUT' });
  },

  async reject(id: string) {
    return request(`/join-requests/${id}/reject`, { method: 'PUT' });
  },
};

// ---- Community ----
export const community = {
  async submit(data: any) {
    return request<{ request: any }>('/community', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async list() {
    return request<{ requests: any[] }>('/community');
  },
};

// ---- Contact ----
export const contact = {
  async send(data: any) {
    return request<{ request: any }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ---- Steward ----
export const steward = {
  async members() {
    return request<{ members: any[] }>('/steward/members');
  },

  async vouch(userId: string) {
    return request(`/steward/vouch/${userId}`, { method: 'PUT' });
  },

  async allSupplies() {
    return request<{ supplies: any[] }>('/steward/supplies');
  },

  async supplyRequests() {
    return request<{ requests: any[] }>('/steward/requests');
  },
};

// ---- AI ----
export const ai = {
  async draftFromImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    return request<{ name: string; description: string; category: string; condition: string; houseRules: string[] }>(
      '/ai/draft-from-image',
      { method: 'POST', body: form }
    );
  },

  async scanBookshelf(file: File) {
    const form = new FormData();
    form.append('image', file);
    return request<{ books: { title: string; author: string }[] }>(
      '/ai/scan-bookshelf',
      { method: 'POST', body: form }
    );
  },

  async generateIllustration(supplyId: string, itemName: string, description: string) {
    return request('/ai/generate-illustration', {
      method: 'POST',
      body: JSON.stringify({ supplyId, itemName, description }),
    });
  },
};
