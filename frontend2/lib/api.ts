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
  remove: (variantId: string) => api.delete(`/api/cart/${variantId}`),
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

export default api;

