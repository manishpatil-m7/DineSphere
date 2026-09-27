import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cart: React.FC = () => {
  const cartStore = useCartStore();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = cartStore.getSubtotal();
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax - discount;

  const handleApplyCoupon = () => {
    if (coupon === 'WELCOME10' && subtotal >= 20) {
      setDiscount(subtotal * 0.10);
      alert('Coupon applied!');
    } else {
      setDiscount(0);
      alert('Invalid coupon or minimum order amount not reached ($20)');
    }
  };

  if (cartStore.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-cream/60 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => navigate('/menu')}
          className="px-8 py-3 bg-gold text-darkBrown font-bold rounded-full hover:bg-white transition"
        >
          Explore Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">Your <span className="text-gold">Cart</span></h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartStore.items.map(item => (
            <div key={item.menuItemId} className="glass-card p-4 flex items-center gap-4">
              <div className="w-20 h-20 bg-charcoal/50 rounded-lg hidden sm:block"></div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="text-gold font-bold">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => cartStore.updateQuantity(item.menuItemId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
                >-</button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => cartStore.updateQuantity(item.menuItemId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
                >+</button>
              </div>
              <button 
                onClick={() => cartStore.removeItem(item.menuItemId)}
                className="text-errorRed p-2 hover:bg-errorRed/10 rounded-full transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 h-fit sticky top-8">
          <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Order Summary</h3>
          
          <div className="space-y-3 text-sm text-cream/80 mb-6 border-b border-white/10 pb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-successGreen">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span>Total</span>
            <span className="text-gold">${total.toFixed(2)}</span>
          </div>

          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Coupon Code"
              className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button 
              onClick={handleApplyCoupon}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm font-semibold transition"
            >
              Apply
            </button>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            className="w-full py-3 bg-gold text-darkBrown font-bold rounded-lg hover:bg-white transition flex justify-center items-center gap-2"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
