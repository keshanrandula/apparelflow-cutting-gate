import {
  User,
  Recipe,
  CuttingOrder,
  ExpectedComponentCalculation,
  Decision,
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  code: string;
  details?: Record<string, string[]>;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json().catch(() => {
    throw new ApiError('Failed to parse server response', 'SERVER_ERROR', response.status);
  });

  if (!response.ok || !data.success) {
    const errorMsg = data.error?.message || `Request failed with status ${response.status}`;
    const errorCode = data.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(errorMsg, errorCode, response.status, data.error?.details);
  }

  return data.data;
}

export const api = {
  // Auth API
  auth: {
    login: (email: string, password: string) =>
      fetchJson<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => fetchJson<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    me: () => fetchJson<{ user: User }>('/api/auth/me'),
  },

  // Recipes API
  recipes: {
    list: () => fetchJson<Recipe[]>('/api/recipes'),
    calculateExpected: (recipeId: string, targetQty: number) =>
      fetchJson<ExpectedComponentCalculation>(
        `/api/recipes?recipeId=${encodeURIComponent(recipeId)}&targetQty=${targetQty}`
      ),
  },

  // Verification Terminal API
  verification: {
    getSheet: (orderId: string) =>
      fetchJson<{ order: CuttingOrder; expectedFabricYds: number; components: unknown[] }>(
        `/api/verification/${orderId}`
      ),
    saveCounts: (orderId: string, counts: Array<{ componentId: string; actualQty: number }>) =>
      fetchJson<CuttingOrder>(`/api/verification/${orderId}/counts`, {
        method: 'PUT',
        body: JSON.stringify({ counts }),
      }),
    approve: (orderId: string, counts: Array<{ componentId: string; actualQty: number }>) =>
      fetchJson<CuttingOrder>(`/api/verification/${orderId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ counts }),
      }),
    reject: (orderId: string, note: string) =>
      fetchJson<CuttingOrder>(`/api/verification/${orderId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
  },

  // Sewing Floor API
  sewing: {
    queue: () => fetchJson<CuttingOrder[]>('/api/sewing/queue'),
    get: (id: string) => fetchJson<CuttingOrder>(`/api/sewing/orders/${id}`),
    start: (id: string, notes?: string) =>
      fetchJson<{ order: CuttingOrder; sewingJob: unknown }>(`/api/sewing/orders/${id}/start`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
  },

  // Orders API
  orders: {
    list: () => fetchJson<CuttingOrder[]>('/api/orders'),
    get: (id: string) => fetchJson<CuttingOrder>(`/api/orders/${id}`),
    create: (input: {
      recipeId: string;
      targetQty: number;
      fabricRollId: string;
      actualFabricYds: number;
    }) =>
      fetchJson<CuttingOrder>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    resubmit: (id: string, updatedFabricYds?: number) =>
      fetchJson<CuttingOrder>(`/api/orders/${id}/resubmit`, {
        method: 'POST',
        body: JSON.stringify({ updatedFabricYds }),
      }),
    saveCounts: (id: string, counts: Array<{ componentId: string; actualQty: number }>) =>
      fetchJson<CuttingOrder>(`/api/orders/${id}/counts`, {
        method: 'PUT',
        body: JSON.stringify({ counts }),
      }),
    verify: (id: string, decision: Decision, rejectionNote?: string) =>
      fetchJson<CuttingOrder>(`/api/orders/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ decision, rejectionNote }),
      }),
    startSewing: (id: string, notes?: string) =>
      fetchJson<{ order: CuttingOrder; sewingJob: unknown }>(`/api/orders/${id}/sewing-start`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
  },
};
