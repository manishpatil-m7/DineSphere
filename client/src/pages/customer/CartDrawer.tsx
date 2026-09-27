import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Tag, CheckCircle2, QrCode, CreditCard, Banknote, ShoppingBag, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const {
    items,
    orderType,
    tableNumber,
    address,
    notes,
    couponCode,
    discount,
    setOrderType,
    setTableNumber,
    setAddress,
    setNotes,
    setCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal
  } = useCartStore();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  useEffect(() => {
    if (isOpen) {
      axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/settings`)
        .then(res => {
          if (res.data.success && res.data.data) {
            setAcceptingOrders(res.data.data.is_accepting_orders);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const total = getTotal();
  const pointsEarned = Math.floor(total / 10);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!inputCoupon.trim()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/coupons/apply`, {
        code: inputCoupon.trim(),
        amount: subtotal
      });
      if (res.data.success) {
        setCoupon(res.data.data.code, res.data.data.discount_amount);
        setCouponSuccess(`Applied: ₹${res.data.data.discount_amount} off`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handlePlaceOrder = async (isPaidSimulated = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to place an order.');
      return;
    }
    if (items.length === 0) return;

    if (orderType === 'Delivery' && !address.trim()) {
      alert('Please enter a delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/orders`,
        {
          items: items.map(item => ({
            dish_id: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: item.specialInstructions
          })),
          order_type: orderType,
          table_number: orderType === 'Dine-in' ? tableNumber : null,
          address: orderType === 'Delivery' ? address : null,
          notes,
          coupon_code: couponCode || null,
          payment_method: paymentMethod,
          payment_status: isPaidSimulated || paymentMethod !== 'Cash' ? 'Paid' : 'Pending'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      clearCart();
      setShowQrModal(false);
      onClose();
      onOrderSuccess(res.data.data.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order. Backend might be unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#121212] border-l border-white/10 h-full flex flex-col shadow-2xl text-[#D7E2EA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#E5A84B]" size={20} />
            <h2 className="text-lg font-bold text-white tracking-wide">Your Order</h2>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <ShoppingBag size={48} className="mb-3 opacity-30 stroke-[1.5]" />
              <p className="font-medium text-white/80">Your cart is currently empty</p>
              <p className="text-xs mt-1">Explore our culinary masterworks and add delicious dishes to order.</p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.menuItemId} 
                    className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.is_veg === false ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      </div>
                      <p className="text-xs text-[#E5A84B] font-mono mt-0.5">₹{item.price} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-white/10 rounded-lg bg-black/40">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                          className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white transition rounded-l"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                          className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white transition rounded-r"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Type Toggle */}
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-3">
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold block">
                  Dining Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Dine-in', 'Takeaway', 'Delivery'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition ${
                        orderType === type
                          ? 'bg-[#E5A84B] text-black border-[#E5A84B]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {orderType === 'Dine-in' && (
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Select Table Number</label>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#E5A84B]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num} className="bg-[#1a1a1a]">
                          Table #{num}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {orderType === 'Delivery' && (
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Delivery Address</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter flat / house no., street, landmarks..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#E5A84B] resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold block mb-1">
                  Cooking Notes / Special Requests
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Less spicy, no peanuts, extra napkins..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#E5A84B]"
                />
              </div>

              {/* Coupon Code Box */}
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold block mb-1.5">
                  Offers & Coupons
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-3 text-white/40" />
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      placeholder="e.g. DINE10, FIRST50"
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-2 text-xs text-white uppercase font-mono tracking-wider outline-none focus:border-[#E5A84B]"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    type="button"
                    className="px-4 py-2 bg-white/10 hover:bg-[#E5A84B] hover:text-black font-semibold rounded-lg text-xs transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-400 mt-1">{couponError}</p>}
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {couponSuccess}
                  </p>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'Card', label: 'Credit Card', icon: CreditCard },
                    { id: 'Cash', label: 'Pay at Counter', icon: Banknote }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                          paymentMethod === m.id
                            ? 'bg-[#E5A84B]/15 border-[#E5A84B] text-[#E5A84B]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px] font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({couponCode})</span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span>Taxes & Restaurant Charges</span>
                  <span className="font-mono text-emerald-400">Included</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-base text-[#E5A84B] font-mono">₹{total}</span>
                </div>
                <div className="text-[11px] text-amber-400/90 pt-1 flex items-center justify-between">
                  <span>Reward Points to Earn</span>
                  <span className="font-mono font-semibold">+{pointsEarned} pts</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-black/50 space-y-2">
            {!acceptingOrders && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs">
                <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                <span>Orders are temporarily paused by kitchen staff.</span>
              </div>
            )}
            {paymentMethod === 'UPI' ? (
              <button
                disabled={!acceptingOrders || isSubmitting}
                onClick={() => setShowQrModal(true)}
                className="w-full py-3 bg-[#E5A84B] text-black font-bold rounded-xl hover:bg-white transition duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <QrCode size={16} />
                <span>Pay ₹{total} via UPI QR</span>
              </button>
            ) : (
              <button
                disabled={!acceptingOrders || isSubmitting}
                onClick={() => handlePlaceOrder(false)}
                className="w-full py-3 bg-[#E5A84B] text-black font-bold rounded-xl hover:bg-white transition duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Placing Order...' : `Place Order (₹${total})`}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mock UPI QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#181818] border border-white/15 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Scan & Pay via UPI</h3>
            <p className="text-xs text-white/60 mb-4">Pay using Google Pay, PhonePe, Paytm or any UPI app</p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-4">
              <QRCodeSVG
                value={`upi://pay?pa=dinesphere@upi&pn=DineSphere%20Restaurant&am=${total}&cu=INR`}
                size={180}
              />
            </div>

            <div className="font-mono text-sm font-bold text-[#E5A84B] mb-2">
              Amount: ₹{total}
            </div>
            <p className="text-[11px] text-white/50 mb-5">
              UPI ID: <span className="text-white font-mono">dinesphere@upi</span>
            </p>

            <div className="space-y-2">
              <button
                disabled={isSubmitting}
                onClick={() => handlePlaceOrder(true)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Processing...' : 'Confirm Payment'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl transition text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
