import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const userService = {
  getMe: (email: string) => api.get(`/user/me?email=${email}`),
};

export const familyService = {
  create: (data: any) => api.post('/family/', data),
  addMember: (data: any) => api.post('/family/add', data),
  revokeMember: (data: any) => api.post('/family/revoke', data),
  update: (data: any) => api.put('/family/update', data),
  delete: (id: string, email: string) => api.delete(`/family/delete/${id}?email=${email}`),
};

export const expenseService = {
  create: (data: any) => api.post('/expense/create', data),
  getAll: (familyId: string) => api.get(`/expense/get-all?familyId=${familyId}`),
  getById: (familyId: string, expenseId: string) => api.get(`/expense/get?familyId=${familyId}&expenseId=${expenseId}`),
  update: (familyId: string, expenseId: string, data: any, userId: string) => api.put(`/expense/update?familyId=${familyId}&expenseId=${expenseId}&userId=${userId}`, data),
  delete: (familyId: string, expenseId: string, userId: string) => api.delete(`/expense/${expenseId}?familyId=${familyId}&userId=${userId}`),
};

export const settlementService = {
  create: (data: any) => api.post('/settlement/create', data),
  getSettlements: (familyId: string) => api.get(`/settlement/family/${familyId}`),
  getMyBills: (userId: string) => api.get(`/settlement/bills/user/${userId}`),
  submitProof: (billId: string, email: string, file: File) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);
    return api.post(`/settlement/bills/${billId}/pay`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  confirmPayment: (billId: string, email: string) => api.post(`/settlement/bills/${billId}/confirm?email=${email}`),
  cancel: (settlementId: string, email: string) => api.delete(`/settlement/${settlementId}/cancel?email=${email}`),
};

export const auditService = {
  getLogs: (familyId: string) => api.get(`/audit/family/${familyId}`),
};

export const getErrorMessage = (error: any) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.details) return data.details;
    if (typeof data === 'object') return JSON.stringify(data);
  }
  if (error.message) return error.message;
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
};

export default api;
