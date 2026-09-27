import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

const Checkout: React.FC = () => {
  const cartStore = useCartStore();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('DINE_IN');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', tableNumber: '' });

  const subtotal = cartStore.getSubtotal();
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate placing order
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      cartStore.clearCart();
    }, 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-charcoal text-cream">
        <CheckCircle size={64} className="text-successGreen mb-6" />
        <h2 className="text-4xl font-bold mb-4">Order Placed Successfully!</h2>
        <p className="text-cream/60 mb-8 max-w-md">
          Your order has been sent to the kitchen. You can track its status in your dashboard.
        </p>
        <button 
          onClick={() => navigate('/home')}
          className="px-8 py-3 border border-gold text-gold font-bold rounded-full hover:bg-gold/10 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (cartStore.items.length === 0) {
    return <div className="p-8 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-white/10 pb-2">Order Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cream/70 mb-1">Order Type</label>
              <select 
                value={orderType} 
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-gold outline-none"
              >
                <option value="DINE_IN">Dine In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-cream/70 mb-1">Name</label>
              <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold" />
            </div>

            {orderType === 'DELIVERY' && (
              <div>
                <label className="block text-sm text-cream/70 mb-1">Delivery Address</label>
                <textarea required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold" />
              </div>
            )}

            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-sm text-cream/70 mb-1">Table Number</label>
                <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold" />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gold text-darkBrown font-bold rounded-lg hover:bg-white transition mt-6 disabled:opacity-50"
            >
              {loading ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="glass-card p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6 border-b border-white/10 pb-2">Summary</h2>
          <div className="space-y-4 mb-6">
            {cartStore.items.map(item => (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2 text-sm text-cream/70">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg text-white mt-4">
              <span>Total</span>
              <span className="text-gold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
