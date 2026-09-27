import React, { useState, useEffect, useCallback } from 'react';
import { ReservationHeader } from './ReservationHeader';
import { DateStrip } from './DateStrip';
import { SlotBar } from './SlotBar';
import { Legend } from './Legend';
import { FloorMap } from './FloorMap';
import { SummaryBar } from './SummaryBar';
import { ConfirmModal } from './ConfirmModal';
import { SuccessScreen } from './SuccessScreen';
import { MyReservationsTab } from './MyReservationsTab';
import type { FloorTable, SlotInfo, CinemaReservation } from './types';
import { reservationApi } from './api';
import axios from 'axios';

export const CinemaReservationsPage: React.FC = () => {
  const [activeTopTab, setActiveTopTab] = useState<'book' | 'my-reservations'>('book');

  // Booking state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('19:30');
  const [guests, setGuests] = useState(2);

  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const [tables, setTables] = useState<FloorTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  // Hold & Confirm state
  const [isHolding, setIsHolding] = useState(false);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Success state
  const [confirmedReservation, setConfirmedReservation] = useState<CinemaReservation | null>(null);

  // Reschedule state
  const [reschedulingReservation, setReschedulingReservation] = useState<CinemaReservation | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [maxDaysAhead, setMaxDaysAhead] = useState(14);
  const [maxTablesPerBooking, setMaxTablesPerBooking] = useState(4);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/settings`)
      .then((res: any) => {
        if (res.data.success && res.data.data) {
          if (res.data.data.max_days_ahead) setMaxDaysAhead(res.data.data.max_days_ahead);
          if (res.data.data.max_tables_per_booking) setMaxTablesPerBooking(res.data.data.max_tables_per_booking);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Slots
  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const data = await reservationApi.getSlots(selectedDate, guests);
      setSlots(data);
      // If current selectedSlot is past or sold out, pick first available
      const current = data.find((s) => s.slot === selectedSlot);
      if (!current || current.status === 'past' || current.status === 'sold_out') {
        const firstAvail = data.find((s) => s.status !== 'past' && s.status !== 'sold_out');
        if (firstAvail) setSelectedSlot(firstAvail.slot);
      }
    } catch (err) {
      console.error('Fetch slots error:', err);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, guests, selectedSlot]);

  // Fetch Floor Layout
  const fetchLayout = useCallback(async () => {
    setTablesLoading(true);
    try {
      const data = await reservationApi.getLayout(selectedDate, selectedSlot);
      setTables(data);

      // Verify currently selected tables are still available
      setSelectedTableIds((prev) => {
        const valid = prev.filter((id) => {
          const t = data.find((tbl) => tbl.id === id);
          return t && (t.status === 'available' || t.status === 'yours');
        });
        if (valid.length < prev.length) {
          showToast('One or more of your chosen tables were booked by another guest.');
        }
        return valid;
      });
    } catch (err) {
      console.error('Fetch layout error:', err);
    } finally {
      setTablesLoading(false);
    }
  }, [selectedDate, selectedSlot]);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate, guests]);

  useEffect(() => {
    fetchLayout();
    // Auto-refresh layout every 10 seconds for real-time multiplayer updates
    const interval = setInterval(fetchLayout, 10000);
    return () => clearInterval(interval);
  }, [selectedDate, selectedSlot]);

  // Toggle table selection
  const handleToggleTable = (table: FloorTable) => {
    const isSelected = selectedTableIds.includes(table.id);

    if (isSelected) {
      setSelectedTableIds((prev) => prev.filter((id) => id !== table.id));
    } else {
      if (selectedTableIds.length >= maxTablesPerBooking) {
        showToast(`You can select up to ${maxTablesPerBooking} tables at a time.`);
        return;
      }
      setSelectedTableIds((prev) => [...prev, table.id]);
    }
  };

  // Proceed -> call /hold
  const handleProceed = async () => {
    if (selectedTableIds.length === 0) return;

    // If rescheduling, skip hold and open confirm modal directly
    if (reschedulingReservation) {
      setIsConfirmModalOpen(true);
      return;
    }

    setIsHolding(true);
    try {
      const res = await reservationApi.holdTables(selectedDate, selectedSlot, selectedTableIds);
      setHoldId(res.hold_id);
      setHoldExpiresAt(res.expires_at);
      setIsConfirmModalOpen(true);
      fetchLayout();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not hold selected tables');
      fetchLayout();
    } finally {
      setIsHolding(false);
    }
  };

  const handleHoldExpired = async () => {
    setIsConfirmModalOpen(false);
    setHoldId(null);
    setHoldExpiresAt(null);
    setSelectedTableIds([]);
    showToast('Your 5-minute table hold has expired. Please select your tables again.');
    fetchLayout();
  };

  const handleConfirmReservation = async (payload: {
    hold_id: string;
    guests: number;
    occasion?: string;
    special_request?: string;
    payment_method: string;
  }) => {
    setIsSubmittingConfirm(true);
    try {
      if (reschedulingReservation) {
        const resv = await reservationApi.rescheduleReservation(reschedulingReservation.id, {
          date: selectedDate,
          slot: selectedSlot,
          table_ids: selectedTableIds
        });
        setConfirmedReservation(resv);
        setIsConfirmModalOpen(false);
        setReschedulingReservation(null);
        setSelectedTableIds([]);
        showToast('Reservation rescheduled successfully!');
      } else {
        const resv = await reservationApi.confirmReservation(payload);
        setConfirmedReservation(resv);
        setIsConfirmModalOpen(false);
        setHoldId(null);
        setHoldExpiresAt(null);
        setSelectedTableIds([]);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to confirm reservation');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const selectedTables = tables.filter((t) => selectedTableIds.includes(t.id));

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#D7E2EA] font-kanit">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#241315] border border-red-500/50 text-white px-5 py-2.5 rounded-full text-xs shadow-2xl animate-slideDown flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top Tabs: Book a Table vs My Reservations */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveTopTab('book');
                setConfirmedReservation(null);
              }}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider transition cursor-pointer border ${
                activeTopTab === 'book'
                  ? 'bg-gradient-to-r from-[#B600A8] via-[#7621B0] to-[#BE4C00] text-white border-transparent shadow-md shadow-[#B600A8]/20'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Book a Table
            </button>
            <button
              onClick={() => {
                setActiveTopTab('my-reservations');
                setConfirmedReservation(null);
              }}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider transition cursor-pointer border ${
                activeTopTab === 'my-reservations'
                  ? 'bg-gradient-to-r from-[#B600A8] via-[#7621B0] to-[#BE4C00] text-white border-transparent shadow-md shadow-[#B600A8]/20'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              My Reservations
            </button>
          </div>

          {reschedulingReservation && (
            <div className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>Rescheduling {reschedulingReservation.code}</span>
              <button
                onClick={() => setReschedulingReservation(null)}
                className="hover:text-white font-bold ml-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Book a Table */}
        {activeTopTab === 'book' && (
          <>
            {confirmedReservation ? (
              <SuccessScreen
                reservation={confirmedReservation}
                onViewReservations={() => {
                  setConfirmedReservation(null);
                  setActiveTopTab('my-reservations');
                }}
                onBookAnother={() => {
                  setConfirmedReservation(null);
                  setSelectedTableIds([]);
                }}
              />
            ) : (
              <div className="space-y-4">
                {/* 1. Header */}
                <ReservationHeader
                  date={selectedDate}
                  slot={selectedSlot}
                  guests={guests}
                  onGuestsChange={(n) => {
                    setGuests(n);
                    setSelectedTableIds([]);
                  }}
                />

                {/* 2. Date Strip */}
                <DateStrip
                  selectedDate={selectedDate}
                  maxDays={maxDaysAhead}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setSelectedTableIds([]);
                  }}
                />

                {/* 3. Slot Bar */}
                <SlotBar
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(s) => {
                    setSelectedSlot(s);
                    setSelectedTableIds([]);
                  }}
                  loading={slotsLoading}
                />

                {/* 4. Legend */}
                <Legend />

                {/* 5. Floor Map */}
                <FloorMap
                  tables={tables}
                  selectedTableIds={selectedTableIds}
                  onToggleTable={handleToggleTable}
                  loading={tablesLoading}
                />

                {/* 6. Summary Bar */}
                <SummaryBar
                  selectedTables={selectedTables}
                  guests={guests}
                  onProceed={handleProceed}
                  isHolding={isHolding}
                  holdExpiresAt={holdExpiresAt}
                  onHoldExpired={handleHoldExpired}
                />

                {/* 7. Confirm Modal */}
                {isConfirmModalOpen && (
                  <ConfirmModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    holdId={holdId || 'reschedule'}
                    selectedTables={selectedTables}
                    date={selectedDate}
                    slot={selectedSlot}
                    guests={guests}
                    onConfirm={handleConfirmReservation}
                    isSubmitting={isSubmittingConfirm}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Tab 2: My Reservations */}
        {activeTopTab === 'my-reservations' && (
          <MyReservationsTab
            onBookTableClick={() => {
              setActiveTopTab('book');
              setConfirmedReservation(null);
            }}
            onRescheduleClick={(resv) => {
              setReschedulingReservation(resv);
              setGuests(resv.guests);
              setSelectedDate(resv.date);
              setSelectedSlot(resv.time_slot);
              setActiveTopTab('book');
            }}
          />
        )}
      </div>
    </div>
  );
};
