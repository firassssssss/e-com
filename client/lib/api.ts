import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  withCredentials: true,
});


// Products
export const productsApi = {
  getAll: (params?: any) => api.get("/api/products", { params }),
  getById: (id: string) => api.get(`/api/products/${id}`),
  getVariants: (productId: string) => api.get(`/api/products/${productId}/variants`),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get("/api/categories"),
  getById: (id: string) => api.get(`/api/categories/${id}`),
  getTree: () => api.get("/api/categories/tree"),
};

// Cart
export const cartApi = {
  get: () => api.get("/api/cart"),
  add: (productId: string, quantity: number, variantId?: string) =>
    api.post("/api/cart", { productId, quantity, variantId }),
  remove: (productId: string) => api.delete(`/api/cart/${productId}`),
  clear: () => api.delete("/api/cart/clear"),
};

// Orders
export const ordersApi = {
  checkout: (data: any) => api.post("/api/orders/checkout", data),
  getAll: () => api.get("/api/orders"),
  getById: (id: string) => api.get(`/api/orders/${id}`),
};

// Wishlist
export const wishlistApi = {
  get: () => api.get("/api/wishlist"),
  add: (productId: string) => api.post("/api/wishlist/items", { productId }),
  remove: (productId: string) => api.delete(`/api/wishlist/items/${productId}`),
};

// Reviews
export const reviewsApi = {
  getByProduct: (productId: string) => api.get(`/api/reviews/product/${productId}`),
  add: (data: { productId: string; rating: number; comment?: string }) =>
    api.post("/api/reviews", data),
  delete: (id: string) => api.delete(`/api/reviews/${id}`),
};

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/sign-in/email", { email, password }),
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/api/auth/sign-up/email", data),
  logout: () => api.post("/api/auth/sign-out"),
  me: () => api.get("/api/v1/users/me"),
};

// Recommendations
export const recommendationsApi = {
  get: (limit?: number) => api.get("/api/v1/recommendations", { params: { limit } }),
};

// Signals
export const signalsApi = {
  track: (data: { type: string; productId?: string; searchQuery?: string }) =>
    api.post("/api/v1/signals", data),
};

// Admin
export const adminApi = {
  // Users
  getUsers:      ()                              => api.get("/api/admin/users"),
  getUserById:   (userId: string)                => api.get(`/api/admin/users/${userId}`),
  updateRole:    (userId: string, role: string)  =>
    api.patch(`/api/admin/users/${userId}/role`, { role }),
  suspendUser:   (userId: string)                => api.delete(`/api/admin/users/${userId}`),

  // Products
  getProducts:   ()                                => api.get("/api/admin/products"),
  createProduct: (data: Record<string, unknown>)  => api.post("/api/admin/products", data),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/admin/products/${id}`, data),
  deleteProduct: (id: string)                     => api.delete(`/api/admin/products/${id}`),

  // Analytics
  getOverview:          ()                        => api.get("/api/admin/analytics/overview"),
  getActivityAnalytics: (period = "week")         => api.get("/api/admin/analytics/activity", { params: { period } }),
  getUsersSummary:      ()                        => api.get("/api/admin/analytics/users/summary"),
  getSignalsBreakdown:  (days = 7)                => api.get("/api/admin/analytics/signals/breakdown", { params: { days } }),
  getUserGraph:         ()                        => api.get("/api/admin/graph/users"),

  // Chat
  getChatHealth:    ()                            => api.get("/api/admin/chat/health"),
  getChatUsers:     (days = 30)                   => api.get("/api/admin/chat/users", { params: { days } }),
  getChatMessages:  (params: {
    userId?: string; sessionId?: string;
    suspiciousOnly?: boolean; limit?: number;
  })                                              => api.get("/api/admin/chat/messages", { params }),
  getChatQuality:   (days = 30)                   => api.get("/api/admin/chat/quality", { params: { days } }),
  ragReindex:       ()                            => api.post("/api/admin/rag/reindex"),

  // User details
  getUserActivity: (userId: string)               => api.get(`/api/admin/users/${userId}/activity`),
  getUserChat:     (userId: string)               => api.get(`/api/admin/users/${userId}/chat`),
};

export default api;

