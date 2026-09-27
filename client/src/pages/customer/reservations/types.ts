export interface FloorTable {
  id: string;
  label: string;
  zone: 'Lounge' | 'Window' | 'Family' | 'Regular';
  row_label: string;
  col_index: number;
  block: 'left' | 'center' | 'right';
  seats: number;
  fee: number;
  status: 'available' | 'booked' | 'held' | 'yours';
}

export interface SlotInfo {
  slot: string;
  free_tables: number;
  total_tables: number;
  status: 'available' | 'fast_filling' | 'almost_full' | 'sold_out' | 'past';
}

export interface TableHoldResponse {
  hold_id: string;
  expires_at: string;
  table_labels: string[];
}

export interface ReservationTableAssignment {
  id: string;
  table_id: string;
  table_label: string;
  date: string;
  time_slot: string;
  active: boolean;
}

export interface CinemaReservation {
  id: string;
  code: string;
  date: string;
  time_slot: string;
  guests: number;
  occasion?: string;
  special_request?: string;
  fee_total: number;
  payment_method: string;
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Seated' | 'No-show';
  created_at: string;
  tables: ReservationTableAssignment[];
}
