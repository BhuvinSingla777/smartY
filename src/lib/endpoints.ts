import api from './api-client';

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
  summary: async (params?: Record<string, unknown>) =>
    (await api.get('/pods/summary', { params })).data,
  byBranch: async (params?: Record<string, unknown>) =>
    (await api.get('/pods/by-branch', { params })).data,
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
  createFromSheet: async (
    sheet: { name?: string; headers: string[]; rows: Record<string, unknown>[] },
    selectedIndexes?: number[],
    sheets?: Array<{ name?: string; headers: string[]; rows: Record<string, unknown>[] }>,
    defaultBranch?: string | null,
    fileName?: string | null,
  ) =>
    (
      await api.post('/pods/from-sheet', {
        sheet,
        sheets,
        selectedIndexes,
        defaultBranch,
        fileName,
      })
    ).data,
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
  tasks: async (id: string) => (await api.get(`/pods/${id}/tasks`)).data,
  importTasks: async (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/pods/${id}/tasks`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  moveTask: async (
    id: string,
    taskId: string,
    body: { status: 'TODO' | 'IN_PROGRESS' | 'DONE'; sortOrder?: number },
  ) => (await api.patch(`/pods/${id}/tasks/${taskId}`, body)).data,
  clearTasks: async (id: string) => (await api.delete(`/pods/${id}/tasks`)).data,
};

export const uploadsApi = {
  create: async (file: File, module: 'BDG' | 'PODS') => {
    const form = new FormData();
    form.append('file', file);
    form.append('module', module);
    const { data } = await api.post('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  list: async (page = 1) =>
    (await api.get('/uploads', { params: { page } })).data,
  get: async (id: string) => (await api.get(`/uploads/${id}`)).data,
};

export const queriesApi = {
  list: async (module?: 'BDG' | 'PODS') =>
    (await api.get('/queries', { params: module ? { module } : undefined })).data as Array<{
      id: string;
      name: string;
      module: 'BDG' | 'PODS';
      search: string;
      status: string;
      payload?: Record<string, unknown> | null;
    }>,
  create: async (body: {
    name: string;
    module?: 'BDG' | 'PODS';
    search?: string;
    status?: string;
    payload?: Record<string, unknown>;
  }) => (await api.post('/queries', body)).data,
  update: async (
    id: string,
    body: { name?: string; search?: string; status?: string; payload?: Record<string, unknown> },
  ) => (await api.patch(`/queries/${id}`, body)).data,
  remove: async (id: string) => (await api.delete(`/queries/${id}`)).data,
};

export const importsApi = {
  preview: async (file: File, module: 'BDG' | 'PODS') => {
    const form = new FormData();
    form.append('file', file);
    form.append('module', module);
    const { data } = await api.post('/imports/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  commit: async (file: File, module: 'BDG' | 'PODS') => {
    const form = new FormData();
    form.append('file', file);
    form.append('module', module);
    const { data } = await api.post('/imports/commit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  list: async (page = 1, module?: string) =>
    (await api.get('/imports', { params: { page, module } })).data,
  get: async (id: string) => (await api.get(`/imports/${id}`)).data,
};
