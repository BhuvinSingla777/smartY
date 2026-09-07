import api from './api';

export const dashboardApi = {
  summary: async () => (await api.get('/dashboard/summary')).data,
};

export const bdgApi = {
  list: async (params?: Record<string, unknown>) =>
    (await api.get('/bdg', { params })).data,
  summary: async () => (await api.get('/bdg/summary')).data,
  byRegion: async (params?: Record<string, unknown>) =>
    (await api.get('/bdg/by-region', { params })).data,
  topMembers: async (limit = 10, params?: Record<string, unknown>) =>
    (await api.get('/bdg/top-members', { params: { limit, ...params } })).data,
  create: async (body: Record<string, unknown>) =>
    (await api.post('/bdg', body)).data,
  update: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/bdg/${id}`, body)).data,
  remove: async (id: string) => (await api.delete(`/bdg/${id}`)).data,
  exportUrl: (format: 'csv' | 'xlsx', params?: Record<string, string>) => {
    const q = new URLSearchParams({ format, ...params }).toString();
    return `/api/bdg/export?${q}`;
  },
};

export const podsApi = {
  list: async (params?: Record<string, unknown>) =>
    (await api.get('/pods', { params })).data,
  get: async (id: string) => (await api.get(`/pods/${id}`)).data,
  summary: async () => (await api.get('/pods/summary')).data,
  status: async (params?: Record<string, unknown>) =>
    (await api.get('/pods/status', { params })).data,
  completion: async (limit = 20, params?: Record<string, unknown>) =>
    (await api.get('/pods/completion', { params: { limit, ...params } })).data,
  history: async (
    id: string,
    params?: { range?: string; dateFrom?: string; dateTo?: string },
  ) => (await api.get(`/pods/${id}/history`, { params })).data,
  create: async (body: Record<string, unknown>) =>
    (await api.post('/pods', body)).data,
  update: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/pods/${id}`, body)).data,
  remove: async (id: string) => (await api.delete(`/pods/${id}`)).data,
  upsertDaily: async (
    id: string,
    body: {
      date: string;
      feCompletion?: number | null;
      beCompletion?: number | null;
      integrationCompletion?: number | null;
    },
  ) => (await api.post(`/pods/${id}/daily`, body)).data,
  updateDaily: async (
    id: string,
    dailyId: string,
    body: {
      date?: string;
      feCompletion?: number | null;
      beCompletion?: number | null;
      integrationCompletion?: number | null;
    },
  ) => (await api.patch(`/pods/${id}/daily/${dailyId}`, body)).data,
  removeDaily: async (id: string, dailyId: string) =>
    (await api.delete(`/pods/${id}/daily/${dailyId}`)).data,
  exportUrl: (format: 'csv' | 'xlsx', params?: Record<string, string>) => {
    const q = new URLSearchParams({ format, ...params }).toString();
    return `/api/pods/export?${q}`;
  },
};
