import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Interceptor refresh token via HttpOnly cookie.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    // Don't try to refresh on /auth/me failures from a /login page (already logged out)
    const isOnLoginPage = typeof window !== "undefined" && window.location.pathname.startsWith("/login");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/me") &&
      !isOnLoginPage
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        // Soft redirect via Next router would be nicer, but interceptor has no router access.
        // window.location.href triggers a full reload which clears the in-memory store.
        if (!isOnLoginPage) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
// API functions
export const productApi = {
  getAll: (params?: Record<string, any>) => api.get("/products", { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get("/products/featured"),
  getNewArrivals: () => api.get("/products/new-arrivals"),
  search: (q: string) => api.get("/products/search", { params: { q } }),
  getRelated: (id: string, limit = 8) => api.get(`/products/${id}/related`, { params: { limit } }),
  getCrossSell: (id: string, limit = 4) => api.get(`/products/${id}/cross-sell`, { params: { limit } }),
};

export const sizeGuideApi = {
  get: (categoryId?: string | null) => api.get("/size-guide", { params: categoryId ? { categoryId } : undefined }),
};

export const returnApi = {
  create: (data: any) => api.post("/returns", data),
  getMine: () => api.get("/returns/me"),
  getByCode: (code: string) => api.get(`/returns/${code}`),
};

export const categoryApi = {
  getAll: () => api.get("/categories"),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

export const authApi = {
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: (data: { email: string; password: string; name: string }) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

export const cartApi = {
  get: () => api.get("/cart"),
  addItem: (variantId: string, quantity: number) => api.post("/cart/items", { variantId, quantity }),
  updateItem: (id: string, quantity: number) => api.patch(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete("/cart"),
};

export const orderApi = {
  create: (data: any, idempotencyKey: string) => api.post("/orders", data, { headers: { "x-idempotency-key": idempotencyKey } }),
  getAll: () => api.get("/orders"),
  getByCode: (code: string) => api.get(`/orders/${code}`),
  track: (code: string) => api.get(`/orders/track/${code}`),
  cancel: (code: string) => api.post(`/orders/${code}/cancel`),
};

export const userApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: any) => api.patch("/users/profile", data),
  changePassword: (data: any) => api.patch("/users/password", data),
  getAddresses: () => api.get("/users/addresses"),
  addAddress: (data: any) => api.post("/users/addresses", data),
  updateAddress: (id: string, data: any) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),

  // Location
  searchLocations: (q: string) => api.get("/locations/search", { params: { q } }),
  getProvinces: () => api.get("/locations/provinces"),
  getWardsByProvince: (id: number) => api.get(`/locations/provinces/${id}/wards`),

  // Auth
  getWishlist: () => api.get("/users/wishlist"),
  addToWishlist: (productId: string) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => api.delete(`/users/wishlist/${productId}`),
};

export const paymentApi = {
  createVnpay: (orderCode: string) =>
    api.post("/payment/vnpay/create", { orderCode }),
  createMomo: (orderCode: string) =>
    api.post("/payment/momo/create", { orderCode }),
};

export const reviewApi = {
  getByProductSlug: (slug: string, page = 1, limit = 10) =>
    api.get(`/reviews/products/${slug}`, { params: { page, limit } }),
  getEligibility: (slug: string) => api.get(`/reviews/eligibility/${slug}`),
  create: (data: {
    productId: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
  }) => api.post("/reviews", data),
  update: (id: string, data: any) => api.patch(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const flashSaleApi = {
  getActive: () => api.get("/flash-sale/active"),
  getProducts: (id: string) => api.get(`/flash-sale/${id}/products`),
};

export const loyaltyApi = {
  getBalance: () => api.get("/loyalty/balance"),
  getHistory: (page = 1, limit = 20) =>
    api.get("/loyalty/history", { params: { page, limit } }),
};

export const notificationApi = {
  getPublicKey: () => api.get("/notifications/public-key"),
  subscribe: (subscription: any) =>
    api.post("/notifications/subscribe", subscription),
  unsubscribe: (endpoint: string) =>
    api.post("/notifications/unsubscribe", { endpoint }),
};

export const newsletterApi = {
  subscribe: (email: string) => api.post("/newsletter/subscribe", { email }),
  unsubscribe: (email: string) => api.post("/newsletter/unsubscribe", { email }),
};

export const tailoringApi = {
  create: (data: { requestType?: "CUSTOM" | "BULK"; name: string; phone: string; email?: string; company?: string; quantity?: number; requirements: string }) =>
    api.post("/tailoring", data),
};

export const blogApi = {
  getPosts: (params?: Record<string, any>) => api.get("/blog/posts", { params }),
  getPost: (slug: string) => api.get(`/blog/posts/${slug}`),
  getCategories: () => api.get("/blog/categories"),
  getPopular: () => api.get("/blog/popular"),
};

export const bundleApi = {
  getAll: () => api.get("/bundles"),
  getBySlug: (slug: string) => api.get(`/bundles/${slug}`),
};

export const giftCardApi = {
  getAmounts: () => api.get("/gift-cards/amounts"),
  purchase: (data: { amount: number; recipientEmail: string; recipientName?: string; message?: string }) =>
    api.post("/gift-cards/purchase", data),
  check: (code: string) => api.get(`/gift-cards/check/${code}`),
  redeem: (code: string) => api.post("/gift-cards/redeem", { code }),
  myCards: () => api.get("/gift-cards/my-cards"),
};

export const referralApi = {
  myCode: () => api.get("/referral/my-code"),
  apply: (code: string) => api.post("/referral/apply", { code }),
  stats: () => api.get("/referral/stats"),
};

export const restockApi = {
  notify: (variantId: string, email: string) =>
    api.post("/products/restock-notify", { variantId, email }),
};

export const shippingApi = {
  getProvinces: () => api.get("/shipping/provinces"),
  getDistricts: (provinceId: number) =>
    api.get("/shipping/districts", { params: { provinceId } }),
  getWards: (districtId: number) =>
    api.get("/shipping/wards", { params: { districtId } }),
  calculateFee: (data: {
    toDistrictId?: number;
    toWardCode?: string;
    weight?: number;
    orderValue?: number;
  }) => api.post("/shipping/calculate-fee", data),
};

export const uploadApi = {
  uploadPublicImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============ ADMIN API ============
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),

  upsertSizeGuide: (data: any) => api.put("/admin/size-guide", data),

  getReturns: (params?: Record<string, any>) => api.get("/admin/returns", { params }),
  updateReturn: (id: string, data: any) => api.patch(`/admin/returns/${id}`, data),

  // Products
  getProducts: (params?: Record<string, any>) => api.get("/admin/products", { params }),
  getProduct: (id: string) => api.get(`/admin/products/${id}`),
  createProduct: (data: any) => api.post("/admin/products", data),
  updateProduct: (id: string, data: any) => api.patch(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  updateVariant: (productId: string, variantId: string, data: any) =>
    api.patch(`/admin/products/${productId}/variants/${variantId}`, data),

  // Orders
  getOrders: (params?: Record<string, any>) => api.get("/admin/orders", { params }),
  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  // Vouchers
  getVouchers: (params?: Record<string, any>) => api.get("/admin/vouchers", { params }),
  createVoucher: (data: any) => api.post("/admin/vouchers", data),
  updateVoucher: (id: string, data: any) => api.patch(`/admin/vouchers/${id}`, data),
  deleteVoucher: (id: string) => api.delete(`/admin/vouchers/${id}`),

    // Users
    getUsers: (params?: Record<string, any>) => api.get("/admin/users", { params }),
    getUser: (id: string) => api.get(`/admin/users/${id}`),
    createUser: (data: any) => api.post("/admin/users", data),
    updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    lockUser: (id: string, reason?: string) => api.patch(`/admin/users/${id}/lock`, { reason }),
    unlockUser: (id: string) => api.patch(`/admin/users/${id}/unlock`),
    updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),

  // Banners
  getBanners: () => api.get("/admin/banners"),
  createBanner: (data: any) => api.post("/admin/banners", data),
  updateBanner: (id: string, data: any) => api.patch(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}`),

  // Reviews
  getReviews: (params?: Record<string, any>) => api.get("/admin/reviews", { params }),
  approveReview: (id: string, isApproved: boolean) =>
    api.patch(`/admin/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),

  // Flash sales
  getFlashSales: () => api.get("/admin/flash-sales"),
  getFlashSale: (id: string) => api.get(`/admin/flash-sales/${id}`),
  createFlashSale: (data: any) => api.post("/admin/flash-sales", data),
  updateFlashSale: (id: string, data: any) => api.patch(`/admin/flash-sales/${id}`, data),
  deleteFlashSale: (id: string) => api.delete(`/admin/flash-sales/${id}`),

  // Notifications + points
  sendNotification: (data: { title: string; body: string; url?: string }) =>
    api.post("/admin/notifications/send", data),
  grantPoints: (userId: string, points: number, description?: string) =>
    api.post("/admin/notifications/grant-points", { userId, points, description }),

  // Newsletter
  getNewsletter: (params?: Record<string, any>) =>
    api.get("/admin/newsletter", { params }),
  exportNewsletter: () => api.get("/admin/newsletter/export", { responseType: "blob" }),

  // Tailoring requests (HÃ²m thÆ° Ä‘áº·t may)
  getTailoringRequests: (params?: Record<string, any>) =>
    api.get("/admin/tailoring", { params }),
  updateTailoringRequest: (id: string, data: { status?: string; adminNote?: string }) =>
    api.patch(`/admin/tailoring/${id}`, data),
  deleteTailoringRequest: (id: string) => api.delete(`/admin/tailoring/${id}`),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data: Record<string, string | number | boolean | null>) =>
    api.put("/admin/settings", data),

  // Inventory
  getInventoryCounts: () => api.get("/admin/inventory/counts"),
  getLowStock: () => api.get("/admin/inventory/low-stock"),
  getOutOfStock: () => api.get("/admin/inventory/out-of-stock"),
  updateVariantStock: (variantId: string, stock: number) =>
    api.patch(`/admin/inventory/variant/${variantId}`, { stock }),
  getDefectiveStock: () => api.get("/admin/inventory/defective-stock"),
  getDisposalHistory: (page = 1, limit = 50) => 
    api.get("/admin/inventory/disposal-history", { params: { page, limit } }),
  disposeDefectiveStock: (variantId: string, quantity: number, note?: string) =>
    api.patch(`/admin/inventory/variant/${variantId}/dispose`, { quantity, note }),

  // Reports
  getReportSummary: (from: string, to: string, groupBy: string = "day") =>
    api.get("/admin/reports/summary", { params: { from, to, groupBy } }),
};





