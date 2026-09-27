import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertCircle, RotateCcw, Star, X, MapPin } from 'lucide-react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string; // Placed, Preparing, Ready, Served, Cancelled
  order_type: string;
  table_number?: number;
  address?: string;
  notes?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  points_earned: number;
  created_at: string;
  estimated_minutes: number;
  items: OrderItem[];
}

const statusSteps = ['Placed', 'Preparing', 'Ready', 'Served'];

export const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addItem, setIsCartOpen } = useCartStore();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll for live updates every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const token = localStorage.getItem('token');
    setCancellingId(orderId);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      addItem({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    });
    setIsCartOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    const token = localStorage.getItem('token');
    setSubmittingReview(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/reviews`,
        {
          order_id: reviewOrder.id,
          rating,
          comment: reviewComment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewOrder(null);
          setReviewSuccess(false);
          setReviewComment('');
        }, 1500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Served' && o.status !== 'Cancelled');
  const pastOrders = orders.filter(o => o.status === 'Served' || o.status === 'Cancelled');

  return (
    <div className="space-y-8">
      {/* Active Orders Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="text-[#E5A84B]" size={22} />
          <h2 className="text-xl font-bold text-white tracking-wide">Live Orders & Kitchen Status</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="h-44 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-sm text-white/50">You have no active orders in progress right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const currentStepIndex = statusSteps.indexOf(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#E5A84B]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full text-white/80">
                          {order.order_type} {order.table_number ? `(Table #${order.table_number})` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">
                        Placed on {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block">Estimated Time</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Clock size={12} /> ~{order.estimated_minutes} mins
                        </span>
                      </div>

                      {order.status === 'Placed' && (
                        <button
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="mb-6">
                    <div className="grid grid-cols-4 relative">
                      {/* Connecting Line */}
                      <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-white/10 -z-0">
                        <div
                          className="h-full bg-[#E5A84B] transition-all duration-700"
                          style={{
                            width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%`
                          }}
                        />
                      </div>

                      {statusSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={step} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-[#E5A84B] text-black ring-4 ring-[#E5A84B]/20'
                                  : 'bg-white/10 text-white/40'
                              } ${isCurrent ? 'animate-bounce' : ''}`}
                            >
                              {idx + 1}
                            </div>
                            <span
                              className={`text-xs mt-2 font-medium tracking-wide ${
                                isDone ? 'text-white font-semibold' : 'text-white/40'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-wrap justify-between items-center text-xs">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/70">
                      {order.items.map((it) => (
                        <span key={it.id}>
                          {it.quantity}x <strong className="text-white">{it.name}</strong>
                        </span>
                      ))}
                    </div>
                    <div className="text-[#E5A84B] font-mono font-bold">
                      Total: ₹{order.total}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Orders History */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide mb-4">Past Orders History</h2>
        {pastOrders.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/40 text-xs">
            No completed or cancelled orders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/15 transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-white">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        order.status === 'Served'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 mt-1">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-sm font-mono font-bold text-[#E5A84B]">
                    ₹{order.total}
                  </span>

                  <button
                    onClick={() => handleReorder(order)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-white/10"
                  >
                    <RotateCcw size={12} />
                    <span>Reorder</span>
                  </button>

                  {order.status === 'Served' && (
                    <button
                      onClick={() => {
                        setReviewOrder(order);
                        setRating(5);
                        setReviewComment('');
                      }}
                      className="px-3 py-1.5 bg-[#E5A84B]/10 hover:bg-[#E5A84B]/20 text-[#E5A84B] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-[#E5A84B]/30"
                    >
                      <Star size={12} />
                      <span>Review</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#181818] border border-white/15 rounded-2xl p-6 max-w-md w-full relative shadow-2xl animate-scaleUp text-[#D7E2EA]">
            <button
              onClick={() => setReviewOrder(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Rate Your Dining Experience</h3>
            <p className="text-xs text-white/60 mb-4">
              Order #{reviewOrder.id.slice(0, 8).toUpperCase()}
            </p>

            {reviewSuccess ? (
              <div className="py-8 text-center text-emerald-400">
                <CheckCircle2 size={42} className="mx-auto mb-2" />
                <p className="font-bold text-white">Thank you for your feedback!</p>
                <p className="text-xs text-white/60 mt-1">Your review helps our chefs maintain fine dining excellence.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 block mb-2 font-medium">
                    Your Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          size={28}
                          className={`${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
                    Your Review & Comments
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the flavors, presentation, and service..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#E5A84B] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={submittingReview}
                    onClick={handleSubmitReview}
                    className="flex-1 py-2.5 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => setReviewOrder(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
