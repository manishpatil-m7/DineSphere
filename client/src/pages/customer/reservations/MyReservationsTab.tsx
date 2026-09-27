import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, QrCode, X, AlertTriangle, RotateCcw, Utensils } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { CinemaReservation } from './types';
import { reservationApi } from './api';

interface MyReservationsTabProps {
  onBookTableClick: () => void;
  onRescheduleClick: (reservation: CinemaReservation) => void;
}

const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const MyReservationsTab: React.FC<MyReservationsTabProps> = ({
  onBookTableClick,
  onRescheduleClick
}) => {
  const [reservations, setReservations] = useState<CinemaReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [qrModalReservation, setQrModalReservation] = useState<CinemaReservation | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await reservationApi.getMyReservations();
      setReservations(data);
    } catch (err) {
      console.error('Fetch reservations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (resv: CinemaReservation) => {
    if (!confirm(`Are you sure you want to cancel booking ${resv.code}?`)) return;

    setCancellingId(resv.id);
    try {
      await reservationApi.cancelReservation(resv.id);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  // Determine upcoming vs past
  const now = Date.now();
  const upcomingList: CinemaReservation[] = [];
  const pastList: CinemaReservation[] = [];

  reservations.forEach((r) => {
    const [y, m, d] = r.date.split('-').map(Number);
    const [h, min] = r.time_slot.split(':').map(Number);
    const slotTime = new Date(y, m - 1, d, h, min, 0).getTime();

    if ((slotTime > now && r.status === 'Confirmed') || r.status === 'Seated') {
      upcomingList.push(r);
    } else {
      pastList.push(r);
    }
  });

  const displayList = subTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="space-y-6">
      {/* Sub-tabs toggle */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setSubTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'upcoming'
              ? 'bg-[#E5A84B] text-black shadow-sm'
              : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Upcoming ({upcomingList.length})
        </button>
        <button
          onClick={() => setSubTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'past'
              ? 'bg-[#E5A84B] text-black shadow-sm'
              : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Past & Cancelled ({pastList.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
          <Utensils size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white font-bold text-base">No {subTab} table reservations found</p>
          <p className="text-xs text-white/50 mt-1 mb-6 max-w-sm mx-auto">
            Ready to experience culinary excellence? Reserve your favorite table on our interactive floor plan.
          </p>
          <button
            onClick={onBookTableClick}
            className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition cursor-pointer"
            style={{
              background:
                'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)'
            }}
          >
            Book a Table Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((resv) => {
            const tableLabels = resv.tables.map((t) => t.table_label).join(', ');

            // Check 2 hours prior cancellation constraint
            const [y, m, d] = resv.date.split('-').map(Number);
            const [h, min] = resv.time_slot.split(':').map(Number);
            const slotTime = new Date(y, m - 1, d, h, min, 0).getTime();
            const hoursLeft = (slotTime - Date.now()) / (1000 * 60 * 60);
            const canCancel = hoursLeft >= 2 && resv.status === 'Confirmed';

            return (
              <div
                key={resv.id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-white/20 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-sm font-bold text-[#E5A84B]">
                      {resv.code}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                        resv.status === 'Confirmed'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : resv.status === 'Seated'
                          ? 'bg-[#B600A8]/20 border-[#B600A8]/40 text-purple-300 font-bold'
                          : resv.status === 'Completed'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : resv.status === 'No-show'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-red-500/15 border-red-500/30 text-red-400'
                      }`}
                    >
                      {resv.status}
                    </span>
                    {resv.occasion && (
                      <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                        {resv.occasion}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Table(s): {tableLabels}</span>
                    <span className="text-white/40 font-normal">({resv.guests} Guests)</span>
                  </p>

                  <p className="text-xs text-white/60 mt-1 flex items-center gap-2">
                    <Calendar size={13} className="text-[#E5A84B]" />
                    <span>{resv.date}</span>
                    <span>•</span>
                    <Clock size={13} className="text-[#E5A84B]" />
                    <span className="font-mono font-medium">{resv.time_slot}</span>
                    <span>•</span>
                    <span>Fee: {formatRupees(resv.fee_total)}</span>
                  </p>

                  {resv.special_request && (
                    <p className="text-[11px] text-white/40 italic mt-2">
                      Note: "{resv.special_request}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setQrModalReservation(resv)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl transition cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                  </button>

                  {resv.status === 'Confirmed' && (
                    <>
                      <button
                        onClick={() => onRescheduleClick(resv)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Reschedule</span>
                      </button>

                      <div className="relative group">
                        <button
                          disabled={!canCancel || cancellingId === resv.id}
                          onClick={() => canCancel && handleCancel(resv)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {cancellingId === resv.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                        {!canCancel && (
                          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-30 bg-[#222] border border-white/15 px-2.5 py-1 rounded-lg text-[10px] text-white whitespace-nowrap shadow-xl">
                            Cannot cancel within 2 hours of reservation time
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalReservation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#181818] border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setQrModalReservation(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Reservation QR Pass</h3>
            <p className="text-xs text-white/60 mb-4">Show this to the host upon arrival</p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-4">
              <QRCodeSVG value={qrModalReservation.code} size={160} />
            </div>

            <div className="font-mono text-xl font-bold text-[#E5A84B] mb-2">
              {qrModalReservation.code}
            </div>

            <p className="text-xs text-white/70">
              {qrModalReservation.date} • {qrModalReservation.time_slot}
            </p>
            <p className="text-xs text-white/50 mt-1">
              Table {qrModalReservation.tables.map((t) => t.table_label).join(', ')} • {qrModalReservation.guests} Guests
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
