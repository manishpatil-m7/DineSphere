import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle,
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { KitchenTicket } from '../../types/admin';

export const KitchenPage: React.FC = () => {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await adminApi.getKitchenTickets();
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch kitchen tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleUpdateStatus = async (ticketId: string, nextStatus: string) => {
    try {
      setLoading(true);
      await adminApi.updateOrderStatus(ticketId, nextStatus);
      await fetchTickets();
    } catch (err) {
      console.error('Failed to update kitchen status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (ageMinutes: number) => {
    if (ageMinutes < 10) return 'border-emerald-500 shadow-emerald-500/10';
    if (ageMinutes <= 20) return 'border-amber-500 shadow-amber-500/10';
    return 'border-red-500 shadow-red-500/20 animate-pulse';
  };

  return (
    <div className="space-y-6">
      {/* ── KDS Top Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/50 p-4 rounded-3xl border border-[#D7E2EA]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Kitchen Display System (KDS)</h2>
            <p className="text-xs text-white/50">
              Live prep station queue • {tickets.length} active order{tickets.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Legends */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono pr-4 border-r border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-white/70">&lt; 10m (Fresh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-white/70">10-20m (Prep)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-white/70">&gt; 20m (Urgent)</span>
            </div>
          </div>

          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-2xl border border-white/10 bg-white/5 text-white/70 hover:text-white transition cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen KDS'}</span>
          </button>
        </div>
      </div>

      {/* ── Active Ticket Cards Grid ── */}
      {tickets.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#D7E2EA]/20 rounded-3xl bg-white/[0.01]">
          <ChefHat size={48} className="text-white/20 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Kitchen Queue is Empty</h3>
          <p className="text-xs text-white/50">All orders are currently prepped and served. Good work, Chef!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {tickets.map((t) => (
            <div
              key={t.id}
              className={`rounded-3xl border-2 bg-[#121212] p-6 shadow-xl flex flex-col justify-between transition-all duration-300 ${getBorderColor(
                t.age_minutes
              )}`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div>
                    <span className="font-mono text-xl font-bold text-white tracking-wide">
                      #{t.id.slice(0, 8)}
                    </span>
                    <div className="text-xs font-semibold text-[#E5A84B]">
                      {t.table_number ? `TABLE ${t.table_number}` : t.order_type.toUpperCase()}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                        t.age_minutes > 20
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : t.age_minutes >= 10
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      <Clock size={12} />
                      {t.age_minutes}m
                    </span>
                    <div className="text-[10px] font-mono text-white/40 mt-1 uppercase">
                      Status: {t.status}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-6">
                  {t.items.map((it, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start justify-between">
                      <div>
                        <div className="text-base font-bold text-white leading-tight">
                          {it.name}
                        </div>
                        {it.note && (
                          <div className="text-xs text-amber-400/90 font-medium italic mt-1">
                            ★ Note: {it.note}
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-xl font-bold text-white bg-white/10 px-2.5 py-1 rounded-xl ml-2 shrink-0">
                        x{it.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* General Order Notes */}
                {t.notes && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs italic mb-4">
                    Order Note: {t.notes}
                  </div>
                )}
              </div>

              {/* Big Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex gap-3">
                {t.status === 'Placed' ? (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'Preparing')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm hover:brightness-110 shadow-lg cursor-pointer transition"
                  >
                    <Play size={18} />
                    <span>Start Prep</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'Ready')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:brightness-110 shadow-lg cursor-pointer transition"
                  >
                    <CheckCircle size={18} />
                    <span>Order Ready</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default KitchenPage;
