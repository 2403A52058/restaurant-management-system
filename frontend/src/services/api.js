import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kk_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message
const extractError = (error) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'An unexpected error occurred';
  const err = new Error(message);
  err.errors = error.response?.data?.errors || [];
  err.status = error.response?.status;
  throw err;
};

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authAPI = {
  requestOTP: async (phone, email, name, role) => {
    try {
      const { data } = await api.post('/auth/request-otp', { phone, email, name, role });
      return data;
    } catch (err) { extractError(err); }
  },

  verifyOTP: async (phone, email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, email, otp });
      return data;
    } catch (err) { extractError(err); }
  },

  me: async () => {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Farm API ──────────────────────────────────────────────────────────────
export const farmAPI = {
  list: async (params = {}) => {
    try {
      const { data } = await api.get('/farms', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  getBySlug: async (slug) => {
    try {
      const { data } = await api.get(`/farms/${slug}`);
      return data;
    } catch (err) { extractError(err); }
  },

  getMyFarms: async () => {
    try {
      const { data } = await api.get('/farms/owner/my-farms');
      return data;
    } catch (err) { extractError(err); }
  },

  createFarm: async (farmData) => {
    try {
      const { data } = await api.post('/farms', farmData);
      return data;
    } catch (err) { extractError(err); }
  },

  updateFarm: async (farmId, farmData) => {
    try {
      const { data } = await api.put(`/farms/${farmId}`, farmData);
      return data;
    } catch (err) { extractError(err); }
  },

  getDeliveryEstimate: async (farmId, params) => {
    try {
      const { data } = await api.get(`/farms/${farmId}/delivery-estimate`, { params });
      return data;
    } catch (err) { extractError(err); }
  },

  addBreed: async (farmId, breedData) => {
    try {
      const { data } = await api.post(`/farms/${farmId}/breeds`, breedData);
      return data;
    } catch (err) { extractError(err); }
  },

  getBreeds: async () => {
    try {
      const { data } = await api.get('/breeds');
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Hen / Inventory API ───────────────────────────────────────────────────
export const henAPI = {
  listHens: async (farmId, params = {}) => {
    try {
      const { data } = await api.get(`/hens/farm/${farmId}`, { params });
      return data;
    } catch (err) { extractError(err); }
  },

  addHen: async (henData) => {
    try {
      const { data } = await api.post('/hens', henData);
      return data;
    } catch (err) { extractError(err); }
  },

  updateHen: async (henId, henData) => {
    try {
      const { data } = await api.put(`/hens/${henId}`, henData);
      return data;
    } catch (err) { extractError(err); }
  },

  deleteHen: async (henId) => {
    try {
      const { data } = await api.delete(`/hens/${henId}`);
      return data;
    } catch (err) { extractError(err); }
  },

  updateBreedPrice: async (farmBreedId, priceData) => {
    try {
      const { data } = await api.put(`/farm-breeds/${farmBreedId}/price`, priceData);
      return data;
    } catch (err) { extractError(err); }
  },

  getPriceHistory: async (farmBreedId) => {
    try {
      const { data } = await api.get(`/farm-breeds/${farmBreedId}/price-history`);
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Booking API ───────────────────────────────────────────────────────────
export const bookingAPI = {
  createBooking: async (bookingData) => {
    try {
      const { data } = await api.post('/bookings', bookingData);
      return data;
    } catch (err) { extractError(err); }
  },

  getMyBookings: async (params = {}) => {
    try {
      const { data } = await api.get('/bookings/my', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  getBookingById: async (bookingId) => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data;
    } catch (err) { extractError(err); }
  },

  getFarmBookings: async (farmId, params = {}) => {
    try {
      const { data } = await api.get(`/bookings/farm/${farmId}`, { params });
      return data;
    } catch (err) { extractError(err); }
  },

  respondToQuotation: async (bookingId, response) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/respond`, response);
      return data;
    } catch (err) { extractError(err); }
  },

  sendQuotation: async (bookingId, quotationData) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/quotation`, quotationData);
      return data;
    } catch (err) { extractError(err); }
  },

  initiateHandover: async (bookingId) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/initiate-handover`);
      return data;
    } catch (err) { extractError(err); }
  },

  verifyHandoverOTP: async (bookingId, otp) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/verify-handover`, { otp });
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Payment API ───────────────────────────────────────────────────────────
export const paymentAPI = {
  initiateAdvance: async (bookingId) => {
    try {
      const { data } = await api.post(`/payments/initiate-advance/${bookingId}`);
      return data;
    } catch (err) { extractError(err); }
  },

  initiateRemaining: async (bookingId) => {
    try {
      const { data } = await api.post(`/payments/initiate-remaining/${bookingId}`);
      return data;
    } catch (err) { extractError(err); }
  },

  getPaymentHistory: async (bookingId) => {
    try {
      const { data } = await api.get(`/payments/booking/${bookingId}`);
      return data;
    } catch (err) { extractError(err); }
  },

  getEarnings: async (params = {}) => {
    try {
      const { data } = await api.get('/payments/earnings', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  requestWithdrawal: async (amount) => {
    try {
      const { data } = await api.post('/payments/withdraw', { amount });
      return data;
    } catch (err) { extractError(err); }
  },

  recordPayment: async (paymentData) => {
    try {
      const { data } = await api.post('/payments/record', paymentData);
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Admin API ─────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      return data;
    } catch (err) { extractError(err); }
  },

  getAllFarms: async (params = {}) => {
    try {
      const { data } = await api.get('/admin/farms', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  farmAction: async (farmId, action) => {
    try {
      const { data } = await api.put(`/admin/farms/${farmId}/action`, { action });
      return data;
    } catch (err) { extractError(err); }
  },

  getAllUsers: async (params = {}) => {
    try {
      const { data } = await api.get('/admin/users', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  getSettings: async () => {
    try {
      const { data } = await api.get('/admin/settings');
      return data;
    } catch (err) { extractError(err); }
  },

  updateSettings: async (settings) => {
    try {
      const { data } = await api.put('/admin/settings', settings);
      return data;
    } catch (err) { extractError(err); }
  },

  getFinancials: async (params = {}) => {
    try {
      const { data } = await api.get('/admin/financials', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  getAuditLogs: async (params = {}) => {
    try {
      const { data } = await api.get('/admin/audit-logs', { params });
      return data;
    } catch (err) { extractError(err); }
  },

  getAllBookings: async (params = {}) => {
    try {
      const { data } = await api.get('/admin/bookings', { params });
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Reviews API ───────────────────────────────────────────────────────────
export const reviewsAPI = {
  submitReview: async (reviewData) => {
    try {
      const { data } = await api.post('/reviews', reviewData);
      return data;
    } catch (err) { extractError(err); }
  },

  getFarmReviews: async (farmId) => {
    try {
      const { data } = await api.get(`/reviews/farm/${farmId}`);
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Complaints API ────────────────────────────────────────────────────────
export const complaintsAPI = {
  submitComplaint: async (complaintData) => {
    try {
      const { data } = await api.post('/complaints', complaintData);
      return data;
    } catch (err) { extractError(err); }
  },
};

// ─── Notifications API ─────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: async () => {
    try {
      const { data } = await api.get('/notifications');
      return data;
    } catch (err) { extractError(err); }
  },

  markRead: async (notificationId) => {
    try {
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      return data;
    } catch (err) { extractError(err); }
  },

  markAllRead: async () => {
    try {
      const { data } = await api.put('/notifications/read-all');
      return data;
    } catch (err) { extractError(err); }
  },
};

export default api;
