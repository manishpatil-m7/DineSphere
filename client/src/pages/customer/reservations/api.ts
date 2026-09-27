import axios from 'axios';
import type { FloorTable, SlotInfo, TableHoldResponse, CinemaReservation } from './types';

const API_BASE = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Global interceptor for 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const reservationApi = {
  getSlots: async (date: string, guests: number): Promise<SlotInfo[]> => {
    const res = await axios.get(`${API_BASE}/reservations/slots`, {
      params: { date, guests }
    });
    return res.data.data;
  },

  getLayout: async (date: string, slot: string): Promise<FloorTable[]> => {
    const res = await axios.get(`${API_BASE}/reservations/layout`, {
      params: { date, slot },
      headers: getAuthHeaders()
    });
    return res.data.data;
  },

  holdTables: async (date: string, slot: string, table_ids: string[]): Promise<TableHoldResponse> => {
    const res = await axios.post(
      `${API_BASE}/reservations/hold`,
      { date, slot, table_ids },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  releaseHold: async (hold_id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/reservations/hold/${hold_id}`, {
      headers: getAuthHeaders()
    });
  },

  confirmReservation: async (payload: {
    hold_id: string;
    guests: number;
    occasion?: string;
    special_request?: string;
    payment_method: string;
  }): Promise<CinemaReservation> => {
    const res = await axios.post(`${API_BASE}/reservations/confirm`, payload, {
      headers: getAuthHeaders()
    });
    return res.data.data;
  },

  getMyReservations: async (): Promise<CinemaReservation[]> => {
    const res = await axios.get(`${API_BASE}/reservations`, {
      headers: getAuthHeaders()
    });
    return res.data.data;
  },

  getReservation: async (id: string): Promise<CinemaReservation> => {
    const res = await axios.get(`${API_BASE}/reservations/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data.data;
  },

  cancelReservation: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/reservations/${id}/cancel`, {}, {
      headers: getAuthHeaders()
    });
  },

  rescheduleReservation: async (id: string, payload: {
    date: string;
    slot: string;
    table_ids: string[];
  }): Promise<CinemaReservation> => {
    const res = await axios.post(`${API_BASE}/reservations/${id}/reschedule`, payload, {
      headers: getAuthHeaders()
    });
    return res.data.data;
  }
};
