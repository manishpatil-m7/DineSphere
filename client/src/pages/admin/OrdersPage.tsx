import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Search,
  Filter,
  Volume2,
  VolumeX,
  Printer,
  FileText,
  ChevronRight,
  ArrowRight,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminOrder } from '../../types/admin';

export const OrdersPage: React.FC = () => {
  const { id: routeOrderId } = useParams<{ id?: string }>();
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dinesphere_sound_alerts') === 'true';
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<AdminOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const prevOrdersCount = useRef(0);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const res = await adminApi.getOrders({
        search: search || undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        limit: 100
      });
      if (res.data.success) {
        const fetched = res.data.data.orders;
        // Check if new Placed orders arrived
        const placedCount = fetched.filter((o) => o.status === 'Placed').length;
        if (soundEnabled && placedCount > prevOrdersCount.current && prevOrdersCount.current > 0) {
          playChime();
        }
        prevOrdersCount.current = placedCount;
        setOrders(fetched);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // 5s poll
    return () => clearInterval(interval);
  }, [search, typeFilter, statusFilter, soundEnabled]);

  useEffect(() => {
    if (routeOrderId) {
      const match = orders.find(o => o.id === routeOrderId);
      if (match) {
        setSelectedOrder(match);
      } else {
        adminApi.getOrder(routeOrderId).then(res => {
          if (res.data.success && res.data.data) {
            setSelectedOrder(res.data.data);
          }
        }).catch(() => {});
      }
    }
  }, [routeOrderId, orders]);


  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('dinesphere_sound_alerts', String(nextVal));
    if (nextVal) playChime();
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      setActionLoading(true);
      await adminApi.updateOrderStatus(orderId, nextStatus);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await adminApi.getOrder(orderId);
        setSelectedOrder(updated.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) return;
    try {
      setActionLoading(true);
      await adminApi.cancelOrder(cancelModalOrder.id, cancelReason.trim());
      setCancelModalOrder(null);
      setCancelReason('');
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await adminApi.updateOrderNotes(selectedOrder.id, adminNotes);
      selectedOrder.admin_notes = adminNotes;
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const printTicket = async (orderId: string) => {
    try {
      const res = await adminApi.getOrderTicket(orderId);
      setTicketData(res.data.data);
      setTimeout(() => window.print(), 300);
    } catch (err) {
      console.error(err);
    }
  };

  const printInvoice = async (orderId: string) => {
    try {
      const res = await adminApi.getOrderInvoice(orderId);
      setInvoiceData(res.data.data);
      setTimeout(() => window.print(), 300);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: ('Placed' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled')[] = [
    'Placed',
    'Preparing',
    'Ready',
    'Served',
    'Cancelled'
  ];

  const getNextStatus = (current: string): string | null => {
    if (current === 'Placed') return 'Preparing';
    if (current === 'Preparing') return 'Ready';
    if (current === 'Ready') return 'Served';
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Placed': return 'bg-[#B600A8]/20 text-[#B600A8] border border-[#B600A8]/30';
      case 'Preparing': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Ready': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'Served': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Action Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Order Management</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Real-time kitchen order board, status transitions, and customer invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
              soundEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* View Switch */}
          <div className="flex bg-white/[0.04] border border-[#D7E2EA]/20 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Board View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-[#D7E2EA]/20 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-2.5 text-[#D7E2EA]/40" />
          <input
            type="text"
            placeholder="Search order ID, table, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-[#D7E2EA]/20 pl-10 pr-3 py-2.5 rounded-xl text-white outline-none focus:border-[#B600A8] transition"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2.5 rounded-xl text-white outline-none"
        >
          <option value="All">All Types</option>
          <option value="Dine-in">Dine-in</option>
          <option value="Takeaway">Takeaway</option>
          <option value="Delivery">Delivery</option>
        </select>

        {viewMode === 'table' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2.5 rounded-xl text-white outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Served">Served</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        )}

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-[#D7E2EA]/20 text-white/70 hover:text-white hover:bg-white/5 cursor-pointer transition"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Board View (Kanban) ── */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col);
            const colColors: Record<string, string> = {
              Placed: 'border-[#B600A8]/40 bg-[#B600A8]/5 text-[#B600A8]',
              Preparing: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
              Ready: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
              Served: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
              Cancelled: 'border-red-500/40 bg-red-500/5 text-red-400'
            };

            return (
              <div
                key={col}
                className="flex flex-col rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] p-4 min-w-[260px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D7E2EA]/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colColors[col].split(' ')[0].replace('border', 'bg')}`} />
                    <span className="font-bold text-sm text-white">{col}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/70">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-thin">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-10 text-xs text-white/30 italic">No orders</div>
                  ) : (
                    colOrders.map((o) => {
                      const ageMinutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
                      const next = getNextStatus(o.status);

                      return (
                        <div
                          key={o.id}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-[#D7E2EA]/20 hover:border-[#B600A8]/60 transition shadow-md group relative"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-white">
                              #{o.id.slice(0, 8)}
                            </span>
                            <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                              <Clock size={11} /> {ageMinutes}m ago
                            </span>
                          </div>

                          {/* Guest / Table */}
                          <div className="text-xs text-white/90 font-medium mb-1 truncate">
                            {o.customer?.name || 'Guest'}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-white/50 mb-3">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                              {o.order_type}
                            </span>
                            {o.table_number && (
                              <span className="px-1.5 py-0.5 rounded bg-[#BE4C00]/20 text-[#BE4C00] font-bold">
                                Table {o.table_number}
                              </span>
                            )}
                          </div>

                          {/* Items summary */}
                          <div className="text-xs text-white/70 border-t border-white/5 pt-2 mb-3 space-y-1">
                            {o.items.slice(0, 3).map((it) => (
                              <div key={it.id} className="flex justify-between text-[11px]">
                                <span className="truncate pr-2">• {it.name}</span>
                                <span className="font-mono font-semibold text-white">x{it.quantity}</span>
                              </div>
                            ))}
                            {o.items.length > 3 && (
                              <div className="text-[10px] text-white/40 italic">
                                +{o.items.length - 3} more items
                              </div>
                            )}
                          </div>

                          {/* Footer Total & Actions */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <span className="text-sm font-bold font-mono text-emerald-400">
                              ₹{o.total}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setAdminNotes(o.admin_notes || '');
                                }}
                                className="p-1.5 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              {next && (
                                <button
                                  onClick={() => handleStatusChange(o.id, next)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white text-[11px] font-bold hover:brightness-110 shadow-sm"
                                  title={`Advance to ${next}`}
                                >
                                  <span>{next}</span>
                                  <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase tracking-wider font-medium">
                  <th className="py-3 px-4">Order Info</th>
                  <th className="py-3 px-4">Total Items</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-center">
                        <ShoppingBag size={48} className="text-white/10 mb-4" />
                        <h4 className="text-white font-bold mb-2">No orders found</h4>
                        <p className="text-white/40 text-xs mb-6 max-w-sm">
                          {search || typeFilter !== 'All' || statusFilter !== 'All' ? 'Try adjusting your search filters.' : 'Waiting for new orders to arrive.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                  const isExpanded = expandedRows[o.id];
                  return (
                    <React.Fragment key={o.id}>
                      <tr 
                        className="hover:bg-white/[0.04] transition cursor-pointer group"
                        onClick={() => toggleRow(o.id)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white">#{o.id.slice(0, 8)}</span>
                            <span className="text-[10px] text-white/50 font-medium">
                              {o.customer?.name || 'Guest'} • {o.order_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-white/80">{o.items.length} item(s)</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">₹{o.total}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${getStatusBadge(o.status)}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-white/40 group-hover:text-white/80 transition">
                          {isExpanded ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-black/30 border-t-0">
                          <td colSpan={5} className="p-5">
                            <div className="flex flex-col sm:flex-row gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                              <div className="flex-1 space-y-4">
                                <h4 className="text-sm font-bold text-white">Order Breakdown</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Table</span>
                                    <span className="text-white font-bold">{o.table_number || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Order Placed At</span>
                                    <span className="text-white">
                                      {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Payment</span>
                                    <span className="text-emerald-400 font-bold">{o.payment_method} ({o.payment_status})</span>
                                  </div>
                                </div>
                                <div className="border border-white/10 rounded-xl bg-black/40 p-3 max-h-32 overflow-y-auto mt-2">
                                  {o.items.map((it) => (
                                    <div key={it.id} className="flex justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                                      <div className="text-white">
                                        <span className="font-bold text-white/60 mr-2">x{it.quantity}</span>
                                        {it.name}
                                        {it.note && <span className="text-amber-400/80 italic ml-2">({it.note})</span>}
                                      </div>
                                      <span className="font-mono text-white/60">₹{it.price * it.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="w-full sm:w-56 shrink-0 flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Quick Actions</h4>
                                {getNextStatus(o.status) && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(o.id, getNextStatus(o.status)!); }}
                                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold text-xs hover:brightness-110 transition flex items-center justify-center gap-1"
                                  >
                                    Move to {getNextStatus(o.status)} <ArrowRight size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(o);
                                    setAdminNotes(o.admin_notes || '');
                                  }}
                                  className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 transition text-xs flex items-center justify-center gap-1"
                                >
                                  <Eye size={14} /> Full Details & Notes
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal / Drawer ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Order Details <span className="font-mono text-[#B600A8]">#{selectedOrder.id.slice(0, 8)}</span>
                </h3>
                <p className="text-xs text-[#D7E2EA]/50 font-mono mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Order Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
              <div>
                <span className="text-white/40 block">Customer</span>
                <span className="font-bold text-white">{selectedOrder.customer?.name || 'Guest'}</span>
              </div>
              <div>
                <span className="text-white/40 block">Order Type</span>
                <span className="font-bold text-white">{selectedOrder.order_type}</span>
              </div>
              <div>
                <span className="text-white/40 block">Table</span>
                <span className="font-bold text-white">{selectedOrder.table_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/40 block">Payment</span>
                <span className="font-bold text-emerald-400">{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Order Items</h4>
              <div className="divide-y divide-white/5 border border-white/5 rounded-2xl p-3 bg-white/[0.02]">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between items-center text-xs sm:text-sm">
                    <div>
                      <span className="font-medium text-white">{it.name}</span>
                      {it.note && <div className="text-[11px] text-amber-400/80 italic">Note: {it.note}</div>}
                    </div>
                    <div className="flex items-center gap-6 font-mono">
                      <span className="text-white/60">x{it.quantity}</span>
                      <span className="text-white font-semibold">₹{it.price * it.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill breakdown */}
            <div className="flex justify-end text-xs font-mono space-y-1">
              <div className="w-60 space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-2 mt-2">
                  <span>Total Amount:</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/70 tracking-wider">Internal Admin Notes</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add kitchen or delivery instructions..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="flex-1 bg-black/40 border border-[#D7E2EA]/30 px-3 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#B600A8] transition"
                />
                <button
                  onClick={handleSaveNotes}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 cursor-pointer transition"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D7E2EA]/10">
              <div className="flex gap-2">
                <button
                  onClick={() => printTicket(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/20 text-white text-xs hover:bg-white/10 transition cursor-pointer"
                >
                  <Printer size={14} /> Print KOT
                </button>
                <button
                  onClick={() => printInvoice(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/20 text-white text-xs hover:bg-white/10 transition cursor-pointer"
                >
                  <FileText size={14} /> Print Invoice
                </button>
              </div>

              <div className="flex gap-2">
                {selectedOrder.status !== 'Served' && selectedOrder.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      setCancelModalOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition text-xs font-semibold cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 cursor-pointer shadow-lg shadow-[#B600A8]/20 transition"
                  >
                    Move to {getNextStatus(selectedOrder.status)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Reason Dialog ── */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 border-b border-red-500/20 pb-3">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg text-white">Cancel Order <span className="font-mono">#{cancelModalOrder.id.slice(0, 8)}</span></h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Please specify the cancellation reason. This explanation will be included in the customer notification and recorded in the audit log.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Customer requested cancellation due to schedule delay"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-red-500 transition"
            />
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white text-xs cursor-pointer transition hover:bg-white/5"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || actionLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Print Containers ── */}
      {ticketData && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-mono z-[9999]">
          <h2 className="text-center font-bold text-xl mb-1">DINESPHERE - KITCHEN TICKET</h2>
          <div className="text-center text-sm border-b pb-2 mb-4">
            #{ticketData.orderId.slice(0, 8)} • Table: {ticketData.tableNumber || ticketData.orderType}
          </div>
          <div className="space-y-2 mb-6">
            {ticketData.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-base">
                <span>{it.quantity}x {it.name}</span>
                {it.note && <span className="italic text-xs">({it.note})</span>}
              </div>
            ))}
          </div>
          {ticketData.notes && <div className="border-t pt-2 text-sm italic">Notes: {ticketData.notes}</div>}
        </div>
      )}

      {invoiceData && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-serif z-[9999]">
          <h1 className="text-center font-bold text-2xl mb-1">DineSphere Luxury Dining</h1>
          <p className="text-center text-xs mb-6">{invoiceData.restaurant.address} • {invoiceData.restaurant.phone}</p>
          <div className="border-t border-b py-2 mb-4 text-xs font-mono flex justify-between">
            <div>Order: #{invoiceData.order.id.slice(0, 8)}</div>
            <div>Date: {new Date(invoiceData.order.created_at).toLocaleDateString()}</div>
          </div>
          <div className="text-xs mb-4">
            <div>Customer: {invoiceData.customer.name}</div>
            <div>Payment: {invoiceData.order.payment_method} (PAID)</div>
          </div>
          <div className="space-y-2 mb-6 text-sm">
            {invoiceData.order.items.map((it: any) => (
              <div key={it.id} className="flex justify-between border-b border-dotted pb-1">
                <span>{it.name} x{it.quantity}</span>
                <span>₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
          <div className="text-right text-base font-bold">Total: ₹{invoiceData.order.total}</div>
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
