import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  LayoutGrid,
  List,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminReservation } from '../../types/admin';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [slotFilter, setSlotFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dayMap, setDayMap] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotMap, setSlotMap] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReservations({
        search: search || undefined,
        date: dateFilter || undefined,
        slot: slotFilter || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
      if (res.data.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayMap = async (date: string, slot: string) => {
    try {
      const res = await adminApi.getDayMap(date, slot);
      if (res.data.success) {
        setDayMap(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch day map:', err);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSlotFilter('');
    setSlotMap([]);
    fetchDayMap(date, '');
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    fetchReservations();
  };

  const toggleReservationStatus = (reservationId: string, status: string) => {
    adminApi.updateReservationStatus(reservationId, status).then(() => fetchReservations());
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-white/10 text-white/60';
    if (status === 'Confirmed') colorClass = 'bg-emerald-500/20 text-emerald-400';
    if (status === 'Seated') colorClass = 'bg-blue-500/20 text-blue-400';
    if (status === 'Completed') colorClass = 'bg-gray-500/20 text-gray-400';
    if (status === 'No-show') colorClass = 'bg-amber-500/20 text-amber-400';
    if (status === 'Cancelled') colorClass = 'bg-red-500/20 text-red-400';
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Table Reservations</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            View upcoming bookings and update customer seating status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearch('')}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:bg-white/10 cursor-pointer"
          >
            <Search size={16} />
          </button>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-white outline-none text-sm"
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="next7d">Next 7 Days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-white outline-none text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Seated">Seated</option>
            <option value="Completed">Completed</option>
            <option value="No-show">No Show</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex-1">
          {/* Reservations List */}
          {loading ? (
            <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
              <p className="text-center text-white/60">Loading reservations...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.02]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase font-medium">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Quick Actions</th>
                    <th className="py-3 px-4 text-right">More</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-white/40 italic">
                        No reservations found for these filters
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <React.Fragment key={reservation.id}>
                        <tr className="hover:bg-white/[0.04] transition">
                          <td className="py-3 px-4 font-medium text-white/90">
                            Booking #{reservation.code}
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {reservation.date} at {reservation.time_slot}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {reservation.status === 'Confirmed' && (
                                <button
                                  onClick={() => toggleReservationStatus(reservation.id, 'Seated')}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-[11px] hover:bg-blue-500/30 transition"
                                >
                                  Mark as Seated
                                </button>
                              )}
                              {reservation.status === 'Seated' && (
                                <button
                                  onClick={() => toggleReservationStatus(reservation.id, 'Completed')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium text-[11px] hover:bg-emerald-500/30 transition"
                                >
                                  Mark Completed
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button 
                              onClick={() => toggleRow(reservation.id)}
                              className="text-white/40 hover:text-white transition p-1"
                            >
                              {expandedRows[reservation.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>
                        {expandedRows[reservation.id] && (
                          <tr className="bg-black/30 border-t-0">
                            <td colSpan={5} className="py-3 px-4">
                              <div className="flex flex-wrap gap-6 text-xs text-white/60">
                                <div><span className="block text-white/40 mb-1">Guests</span> {reservation.guests} People</div>
                                <div>
                                  <span className="block text-white/40 mb-1">Assigned Tables</span> 
                                  {reservation.tables.length > 0 ? reservation.tables.map(t => t.table_label).join(', ') : 'None assigned'}
                                </div>
                                <div className="flex-1 text-right pt-2">
                                  {reservation.status !== 'Cancelled' && reservation.status !== 'Completed' && (
                                    <button
                                      onClick={() => toggleReservationStatus(reservation.id, 'Cancelled')}
                                      className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 font-medium text-[11px] hover:bg-red-500/10 transition"
                                    >
                                      Cancel Reservation
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReservationsPage;