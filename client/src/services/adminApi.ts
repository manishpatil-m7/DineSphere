import axios from 'axios';
import type {
  DashboardSummary,
  AlertData,
  AdminOrder,
  KitchenTicket,
  AdminDish,
  AdminInventoryItem,
  DishIngredientItem,
  AdminTable,
  AdminTableBlock,
  AdminReservation,
  AdminCustomer,
  AdminCoupon,
  AdminReview,
  AdminTicket,
  AdminAnnouncement,
  AdminSettings,
  AdminAuditAction
} from '../types/admin';

const adminClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/admin`
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Dashboard & Alerts
  getSummary: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: DashboardSummary }>(`/dashboard/summary`, {
      params: { range, from, to }
    }),
  getAlerts: () =>
    adminClient.get<{ success: boolean; data: AlertData }>('/alerts'),
  search: (q: string) =>
    adminClient.get<{ success: boolean; data: { orders: any[]; customers: any[]; reservations: any[] } }>('/search', {
      params: { q }
    }),

  // Reports
  getRevenueByDay: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { date: string; revenue: number; orders: number }[] }>('/reports/revenue-by-day', {
      params: { range, from, to }
    }),
  getOrdersByStatus: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { status: string; count: number }[] }>('/reports/orders-by-status', {
      params: { range, from, to }
    }),
  getTopDishes: (limit = 5, range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { name: string; quantity: number; revenue: number }[] }>('/reports/top-dishes', {
      params: { limit, range, from, to }
    }),
  getOrdersByHour: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { hour: string; orders: number }[] }>('/reports/orders-by-hour', {
      params: { range, from, to }
    }),
  getOrderTypeSplit: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { type: string; count: number }[] }>('/reports/order-type-split', {
      params: { range, from, to }
    }),
  getCategoryRevenue: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { category: string; revenue: number }[] }>('/reports/category-revenue', {
      params: { range, from, to }
    }),
  getReservationsBySlot: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { slot: string; count: number }[] }>('/reports/reservations-by-slot', {
      params: { range, from, to }
    }),
  getCustomerGrowth: (range = '30d', from?: string, to?: string) =>
    adminClient.get<{ success: boolean; data: { date: string; newCustomers: number; total: number }[] }>('/reports/customer-growth', {
      params: { range, from, to }
    }),
  getExportUrl: (type: 'orders' | 'customers' | 'reservations', from?: string, to?: string) => {
    let url = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/admin/reports/export.csv?type=${type}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    return url;
  },

  // Orders & Kitchen
  getOrders: (params: { status?: string; type?: string; search?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    adminClient.get<{ success: boolean; data: { orders: AdminOrder[]; pagination: any } }>('/orders', { params }),
  getOrder: (id: string) =>
    adminClient.get<{ success: boolean; data: AdminOrder }>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    adminClient.patch<{ success: boolean; data: AdminOrder; message: string }>(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string, reason: string) =>
    adminClient.post<{ success: boolean; message: string }>(`/orders/${id}/cancel`, { reason }),
  updateOrderNotes: (id: string, notes: string) =>
    adminClient.patch<{ success: boolean; message: string }>(`/orders/${id}/notes`, { notes }),
  getOrderTicket: (id: string) =>
    adminClient.get<{ success: boolean; data: any }>(`/orders/${id}/ticket`),
  getOrderInvoice: (id: string) =>
    adminClient.get<{ success: boolean; data: any }>(`/orders/${id}/invoice`),
  getKitchenTickets: () =>
    adminClient.get<{ success: boolean; data: KitchenTicket[] }>('/kitchen/tickets'),
  toggleAcceptingOrders: (value: boolean) =>
    adminClient.patch<{ success: boolean; data: any; message: string }>('/settings/accepting-orders', { value }),

  // Menu
  getDishes: (params?: { search?: string; category?: string; archived?: string }) =>
    adminClient.get<{ success: boolean; data: AdminDish[] }>('/dishes', { params }),
  createDish: (data: Partial<AdminDish>) =>
    adminClient.post<{ success: boolean; data: AdminDish; message: string }>('/dishes', data),
  updateDish: (id: string, data: Partial<AdminDish>) =>
    adminClient.patch<{ success: boolean; data: AdminDish; message: string }>(`/dishes/${id}`, data),
  updateDishAvailability: (id: string, is_available: boolean) =>
    adminClient.patch<{ success: boolean; data: AdminDish; message: string }>(`/dishes/${id}/availability`, { is_available }),
  archiveDish: (id: string) =>
    adminClient.delete<{ success: boolean; message: string }>(`/dishes/${id}`),
  uploadDishImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return adminClient.post<{ success: boolean; data: { image_url: string }; message: string }>(`/dishes/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getDishIngredients: (id: string) =>
    adminClient.get<{ success: boolean; data: DishIngredientItem[] }>(`/dishes/${id}/ingredients`),
  saveDishIngredients: (id: string, ingredients: { item_id: string; qty_per_dish: number }[]) =>
    adminClient.put<{ success: boolean; message: string }>(`/dishes/${id}/ingredients`, { ingredients }),

  // Inventory
  getInventory: (params?: { search?: string; low?: boolean }) =>
    adminClient.get<{ success: boolean; data: { items: AdminInventoryItem[]; totalValue: number; lowStockCount: number } }>('/inventory', {
      params: { search: params?.search, low: params?.low ? 'true' : undefined }
    }),
  createInventoryItem: (data: Partial<AdminInventoryItem>) =>
    adminClient.post<{ success: boolean; data: AdminInventoryItem; message: string }>('/inventory', data),
  updateInventoryItem: (id: string, data: Partial<AdminInventoryItem>) =>
    adminClient.patch<{ success: boolean; data: AdminInventoryItem; message: string }>(`/inventory/${id}`, data),
  adjustInventoryStock: (id: string, delta: number, reason: string) =>
    adminClient.post<{ success: boolean; data: AdminInventoryItem; message: string }>(`/inventory/${id}/adjust`, { delta, reason }),
  deleteInventoryItem: (id: string) =>
    adminClient.delete<{ success: boolean; message: string }>(`/inventory/${id}`),

  // Tables & Blocks
  getTables: () =>
    adminClient.get<{ success: boolean; data: AdminTable[] }>('/tables'),
  createTable: (data: Partial<AdminTable>) =>
    adminClient.post<{ success: boolean; data: AdminTable; message: string }>('/tables', data),
  updateTable: (id: string, data: Partial<AdminTable>) =>
    adminClient.patch<{ success: boolean; data: AdminTable; message: string }>(`/tables/${id}`, data),
  deleteTable: (id: string) =>
    adminClient.delete<{ success: boolean; message: string }>(`/tables/${id}`),
  getTableBlocks: (date?: string) =>
    adminClient.get<{ success: boolean; data: AdminTableBlock[] }>('/table-blocks', { params: { date } }),
  createTableBlock: (data: { table_id: string; date: string; time_slot?: string | null; reason: string }) =>
    adminClient.post<{ success: boolean; data: AdminTableBlock; message: string }>('/table-blocks', data),
  deleteTableBlock: (id: string) =>
    adminClient.delete<{ success: boolean; message: string }>(`/table-blocks/${id}`),

  // Reservations
  getReservations: (params?: { date?: string; slot?: string; status?: string; search?: string }) =>
    adminClient.get<{ success: boolean; data: AdminReservation[] }>('/reservations', { params }),
  getReservation: (id: string) =>
    adminClient.get<{ success: boolean; data: AdminReservation }>(`/reservations/${id}`),
  createWalkInReservation: (data: { guest_name: string; guest_phone: string; guests: number; date: string; time_slot: string; table_ids: string[] }) =>
    adminClient.post<{ success: boolean; data: AdminReservation; message: string }>('/reservations/walk-in', data),
  updateReservationStatus: (id: string, status: string) =>
    adminClient.patch<{ success: boolean; message: string }>(`/reservations/${id}/status`, { status }),
  moveReservationTables: (id: string, table_ids: string[]) =>
    adminClient.patch<{ success: boolean; message: string }>(`/reservations/${id}/tables`, { table_ids }),
  getDayMap: (date: string, slot: string) =>
    adminClient.get<{ success: boolean; data: { id: string; label: string; zone: string; seats: number; state: 'free' | 'booked' | 'blocked'; details?: any }[] }>('/reservations/day-map', {
      params: { date, slot }
    }),

  // Customers
  getCustomers: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
    axios.get<{ success: boolean; data: { customers: AdminCustomer[]; pagination: any } }>(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/customers`, 
      { params, headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
    ),
  getCustomer: (id: string) =>
    axios.get<{ success: boolean; data: any }>(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/customers/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
    ),
  toggleCustomer: (id: string) =>
    adminClient.patch<{ success: boolean; data: AdminCustomer; message: string }>(`/customers/${id}/toggle`),
  adjustCustomerPoints: (id: string, delta: number, reason: string) =>
    adminClient.post<{ success: boolean; data: AdminCustomer; message: string }>(`/customers/${id}/points`, { delta, reason }),

  // Coupons
  getCoupons: () =>
    adminClient.get<{ success: boolean; data: AdminCoupon[] }>('/coupons'),
  createCoupon: (data: Partial<AdminCoupon>) =>
    adminClient.post<{ success: boolean; data: AdminCoupon; message: string }>('/coupons', data),
  updateCoupon: (id: string, data: Partial<AdminCoupon>) =>
    adminClient.patch<{ success: boolean; data: AdminCoupon; message: string }>(`/coupons/${id}`, data),
  toggleCoupon: (id: string) =>
    adminClient.patch<{ success: boolean; data: AdminCoupon; message: string }>(`/coupons/${id}/toggle`),

  // Reviews
  getReviews: (params?: { rating?: string; hidden?: string }) =>
    adminClient.get<{ success: boolean; data: { reviews: AdminReview[]; avgRating: string; total: number } }>('/reviews', { params }),
  toggleHideReview: (id: string) =>
    adminClient.patch<{ success: boolean; data: AdminReview; message: string }>(`/reviews/${id}/hide`),
  replyToReview: (id: string, message: string) =>
    adminClient.post<{ success: boolean; data: AdminReview; message: string }>(`/reviews/${id}/reply`, { message }),

  // Support
  getTickets: (status?: string) =>
    adminClient.get<{ success: boolean; data: AdminTicket[] }>('/tickets', { params: { status } }),
  getTicket: (id: string) =>
    adminClient.get<{ success: boolean; data: { ticket: AdminTicket; customer: any; replies: any[] } }>(`/tickets/${id}`),
  replyToTicket: (id: string, message: string) =>
    adminClient.post<{ success: boolean; data: any; message: string }>(`/tickets/${id}/reply`, { message }),
  updateTicketStatus: (id: string, status: 'Open' | 'Closed') =>
    adminClient.patch<{ success: boolean; data: AdminTicket; message: string }>(`/tickets/${id}/status`, { status }),

  // Announcements
  sendAnnouncement: (data: { title: string; message: string; audience: string }) =>
    adminClient.post<{ success: boolean; message: string }>('/announcements', data),
  getAnnouncements: () =>
    adminClient.get<{ success: boolean; data: AdminAnnouncement[] }>('/announcements'),

  // Settings
  getSettings: () =>
    adminClient.get<{ success: boolean; data: AdminSettings }>('/settings'),
  updateSettings: (data: Partial<AdminSettings>) =>
    adminClient.patch<{ success: boolean; data: AdminSettings; message: string }>('/settings', data),

  // Audit Log
  getAuditLog: (params?: { entity?: string; page?: number; limit?: number }) =>
    adminClient.get<{ success: boolean; data: { logs: AdminAuditAction[]; pagination: any } }>('/audit-log', { params })
};
