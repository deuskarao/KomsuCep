const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function hashPassword(password) {
  if (!password) return password;
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
  return data;
};

export const dbService = {
  // Auth
  login: (email, password) => apiCall('/login', 'POST', { email, password }),
  forgotPassword: (email) => apiCall('/auth/forgot-password', 'POST', { email }),
  resetPassword: (token, newPassword) => apiCall('/auth/reset-password', 'POST', { token, newPassword }),

  // Users
  getUsers: () => apiCall('/users'),
  getUser: (userId) => apiCall(`/users/${userId}`),
  addUser: (userData) => apiCall('/users', 'POST', userData),
  updateUser: (userId, data) => apiCall(`/users/${userId}`, 'PUT', data),
  deleteUser: (userId) => apiCall(`/users/${userId}`, 'DELETE'),
  
  // Apartment
  getApartment: (aptId) => apiCall(`/apartments/${aptId}`),
  saveApartment: (aptId, aptData) => apiCall(`/apartments/${aptId}`, 'POST', aptData),
  findApartmentByCode: (code) => apiCall(`/apartments/code/${code}`),
  deleteApartmentData: (aptId) => apiCall(`/apartments/${aptId}`, 'DELETE'),

  // Arrays (Sync)
  getTransactions: (aptId) => apiCall(`/transactions/${aptId}`),
  saveTransactions: (aptId, dataArray) => apiCall(`/transactions/${aptId}`, 'POST', dataArray),

  getAnnouncements: (aptId) => apiCall(`/announcements/${aptId}`),
  saveAnnouncements: (aptId, dataArray) => apiCall(`/announcements/${aptId}`, 'POST', dataArray),

  getRequests: (aptId) => apiCall(`/requests/${aptId}`),
  saveRequests: (aptId, dataArray) => apiCall(`/requests/${aptId}`, 'POST', dataArray),

  getRepairs: (aptId) => apiCall(`/repairs/${aptId}`),
  saveRepairs: (aptId, dataArray) => apiCall(`/repairs/${aptId}`, 'POST', dataArray),

  getPolls: (aptId) => apiCall(`/polls/${aptId}`),
  savePolls: (aptId, dataArray) => apiCall(`/polls/${aptId}`, 'POST', dataArray),

  getDues: (aptId) => apiCall(`/dues/${aptId}`),
  saveDues: (aptId, dataArray) => apiCall(`/dues/${aptId}`, 'POST', dataArray)
};
