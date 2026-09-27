export interface DashboardSummary {
  revenue: { value: number; delta: string };
  orders: { value: number; delta: string };
  aov: { value: number; delta: string };
  reservations: { value: number; delta: string };
  newCustomers: { value: number; delta: string };
  cancelledOrders: { value: number; delta: string };
  is_accepting_orders: boolean;
}

export interface AlertData {
  new_orders: number;
  low_stock: number;
  low_stock_items: { id: string; name: string; quantity: number; low_threshold: number; unit: string }[];
  open_tickets: number;
  todays_reservations: number;
}

export interface AdminOrderItem {
  id: string;
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string | null;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: 'Placed' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';
  order_type: 'Dine-in' | 'Takeaway' | 'Delivery';
  table_number?: number | null;
  address?: string | null;
  notes?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code?: string | null;
  payment_method: string;
  payment_status: string;
  points_earned: number;
  created_at: string;
  estimated_minutes: number;
  cancel_reason?: string | null;
  admin_notes?: string | null;
  status_changed_by_admin: boolean;
  items: AdminOrderItem[];
  customer?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface KitchenTicket {
  id: string;
  status: string;
  order_type: string;
  table_number?: number | null;
  notes?: string | null;
  created_at: string;
  age_minutes: number;
  items: {
    name: string;
    quantity: number;
    note?: string | null;
  }[];
}

export interface AdminDish {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  is_veg: boolean;
  image_url?: string | null;
  rating: number;
  is_available: boolean;
  is_archived: boolean;
  createdAt: string;
}

export interface AdminInventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_threshold: number;
  cost_per_unit: number;
  created_at: string;
}

export interface DishIngredientItem {
  id: string;
  dish_id: string;
  item_id: string;
  qty_per_dish: number;
  item?: AdminInventoryItem;
}

export interface AdminTable {
  id: string;
  label: string;
  zone: string;
  row_label: string;
  col_index: number;
  block: string;
  seats: number;
  fee: number;
  is_active: boolean;
}

export interface AdminTableBlock {
  id: string;
  table_id: string;
  date: string;
  time_slot?: string | null;
  reason: string;
  created_at: string;
  table?: AdminTable;
}

export interface AdminReservation {
  id: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  source: string;
  code: string;
  date: string;
  time_slot: string;
  guests: number;
  occasion?: string | null;
  special_request?: string | null;
  fee_total: number;
  payment_method: string;
  status: 'Confirmed' | 'Seated' | 'Completed' | 'No-show' | 'Cancelled';
  created_at: string;
  tables: {
    id: string;
    table_id: string;
    table_label: string;
  }[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  table_labels?: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  points: number;
  is_active: boolean;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  level?: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discount_percent: number;
  min_order: number;
  usage_limit?: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from?: string | null;
  expires_at?: string | null;
  is_active: boolean;
}

export interface AdminReview {
  id: string;
  user_id: string;
  order_id: string;
  dish_id?: string | null;
  rating: number;
  comment?: string | null;
  is_hidden: boolean;
  admin_reply?: string | null;
  created_at: string;
  customer?: {
    name: string;
    email: string;
  };
}

export interface AdminTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'Open' | 'Closed';
  created_at: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  replies?: AdminTicketReply[];
}

export interface AdminTicketReply {
  id: string;
  ticket_id: string;
  author_role: 'admin' | 'customer';
  message: string;
  created_at: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  audience: string;
  recipientCount: number;
  createdAt: string;
}

export interface AdminSettings {
  id: string;
  restaurant_name: string;
  phone: string;
  address: string;
  tax_percent: number;
  points_per_rupees: number;
  reservation_slots: string[];
  max_days_ahead: number;
  hold_minutes: number;
  cancel_window_hours: number;
  max_tables_per_booking: number;
  is_accepting_orders: boolean;
}

export interface AdminAuditAction {
  id: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  details?: string | null;
  created_at: string;
}
