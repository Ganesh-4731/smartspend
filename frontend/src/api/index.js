import http from './client.js';

export const authApi = {
  register: (body) => http.post('/auth/register', body),
  login: (body) => http.post('/auth/login', body),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/auth/me'),
};
export const userApi = {
  update: (body) => http.put('/users/me', body),
  changePassword: (body) => http.put('/users/me/password', body),
  remove: (body) => http.delete('/users/me', { data: body }),
};
export const transactionApi = {
  list: (params) => http.get('/transactions', { params }),
  create: (body) => http.post('/transactions', body),
  update: (id, body) => http.put(`/transactions/${id}`, body),
  remove: (id) => http.delete(`/transactions/${id}`),
  exportCsv: (params) => http.get('/transactions/export', { params, responseType: 'blob' }),
};
export const dashboardApi = { get: (params) => http.get('/dashboard', { params }) };
export const budgetApi = {
  list: () => http.get('/budgets'),
  status: (month) => http.get('/budgets/status', { params: { month } }),
  create: (body) => http.post('/budgets', body),
  update: (id, body) => http.put(`/budgets/${id}`, body),
  remove: (id) => http.delete(`/budgets/${id}`),
};
export const goalApi = {
  list: () => http.get('/goals'),
  create: (body) => http.post('/goals', body),
  update: (id, body) => http.put(`/goals/${id}`, body),
  remove: (id) => http.delete(`/goals/${id}`),
  contribute: (id, body) => http.post(`/goals/${id}/contributions`, body),
  removeContribution: (id, cid) => http.delete(`/goals/${id}/contributions/${cid}`),
};
export const insightApi = { get: (params) => http.get('/insights', { params }) };
export const reportApi = { get: (params) => http.get('/reports', { params }) };
