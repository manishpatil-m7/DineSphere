import React, { useState, useEffect } from 'react';
import { Search, Heart, Star, Plus, Minus, Check, Flame, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';

interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_veg: boolean;
  image_url: string;
  rating: number;
  is_available: boolean;
  is_archived?: boolean;
}

export const MenuTab: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favLoading, setFavLoading] = useState<string | null>(null);
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const { items, addItem, updateQuantity, removeItem, setIsCartOpen } = useCartStore();

  const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks'];

  useEffect(() => {
    fetchDishes();
    fetchFavorites();
    fetchSettings();
  }, [category, vegOnly]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/settings`);
      if (res.data.success && res.data.data) {
        setAcceptingOrders(res.data.data.is_accepting_orders);
      }
    } catch {}
  };


  const fetchDishes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'All') params.category = category;
      if (vegOnly) params.veg_only = 'true';
      if (search) params.search = search;

      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/dishes`, { params });
      if (res.data.success) {
        setDishes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFavoriteIds(res.data.dishIds || []);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const toggleFavorite = async (dishId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setFavLoading(dishId);
    const isFav = favoriteIds.includes(dishId);
    try {
      if (isFav) {
        await axios.delete(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/favorites/${dishId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteIds(prev => prev.filter(id => id !== dishId));
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/favorites/${dishId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteIds(prev => [...prev, dishId]);
      }
    } catch (err) {
      console.error('Favorite error:', err);
    } finally {
      setFavLoading(null);
    }
  };

  const filteredDishes = dishes.filter(dish => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return dish.name.toLowerCase().includes(q) || dish.description?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDishes()}
            placeholder="Search aromatic dishes, ingredients, drinks..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-white/40 outline-none focus:border-[#E5A84B] transition"
          />
        </div>

        {/* Veg-only toggle */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/80 font-medium">
            <span className="w-4 h-4 border border-emerald-500 flex items-center justify-center p-0.5 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <span>Pure Veg Only</span>
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="hidden"
            />
            <div className={`w-9 h-5 rounded-full p-0.5 transition ${vegOnly ? 'bg-emerald-500' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition transform ${vegOnly ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Accepting Orders Paused Banner */}
      {!acceptingOrders && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-amber-300 mb-2 shadow-lg animate-fade-in">
          <AlertTriangle className="shrink-0 text-amber-400" size={22} />
          <div>
            <div className="font-bold text-sm text-white">Kitchen Orders Temporarily Paused</div>
            <div className="text-xs text-[#D7E2EA]/80 mt-0.5">
              We are currently not accepting new orders. You are welcome to browse our menu, but ordering and checkout are paused.
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition cursor-pointer border ${
              category === cat
                ? 'bg-[#E5A84B] text-black border-[#E5A84B] shadow-md shadow-[#E5A84B]/20'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dish Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white/[0.03] border border-white/5 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
          <p className="text-white/60 text-sm">No culinary creations found matching your criteria.</p>
          <button
            onClick={() => { setCategory('All'); setVegOnly(false); setSearch(''); }}
            className="mt-3 text-xs text-[#E5A84B] font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map((dish) => {
            const cartItem = items.find(i => i.menuItemId === dish.id);
            const isFav = favoriteIds.includes(dish.id);

            return (
              <div
                key={dish.id}
                className="group bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-[#E5A84B]/40 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-[#E5A84B]/5"
              >
                {/* Image & Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-white/5">
                  <img
                    src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                    alt={dish.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      !dish.is_available || dish.is_archived ? 'grayscale opacity-40' : ''
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Unavailable Badge Overlay */}
                  {(!dish.is_available || dish.is_archived) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-2 text-center z-10">
                      <span className="px-3 py-1 bg-red-500/80 border border-red-400/50 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        Currently Unavailable
                      </span>
                    </div>
                  )}

                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/15 flex items-center gap-1.5 shadow-sm">
                    <span className={`w-3.5 h-3.5 border ${dish.is_veg ? 'border-emerald-500' : 'border-red-500'} flex items-center justify-center p-0.5 rounded-sm`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                      {dish.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    onClick={() => toggleFavorite(dish.id)}
                    disabled={favLoading === dish.id}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-red-400 hover:scale-110 transition cursor-pointer"
                  >
                    <Heart
                      size={16}
                      className={isFav ? 'fill-red-500 text-red-500' : 'text-white/70'}
                    />
                  </button>

                  {/* Category Pill on Image */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-[11px] bg-black/60 backdrop-blur-md text-[#E5A84B] px-2.5 py-0.5 rounded-full border border-[#E5A84B]/30 font-medium">
                      {dish.category}
                    </span>
                    {dish.rating >= 4.8 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium flex items-center gap-1">
                        <Flame size={10} /> Chef Pick
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-lg border border-white/15 text-xs font-semibold flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{dish.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Body info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#E5A84B] transition">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 mt-1 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/40 block uppercase tracking-wider">Price</span>
                      <span className="text-lg font-bold text-white font-mono">₹{dish.price}</span>
                    </div>

                    {(!dish.is_available || dish.is_archived) ? (
                      <span className="px-3 py-1.5 bg-white/5 text-white/40 rounded-xl text-xs font-semibold cursor-not-allowed border border-white/5">
                        Unavailable
                      </span>
                    ) : !acceptingOrders ? (
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-300/60 rounded-xl text-xs font-semibold cursor-not-allowed border border-amber-500/20">
                        Orders Paused
                      </span>
                    ) : cartItem ? (
                      <div className="flex items-center gap-2 bg-white/10 border border-[#E5A84B]/40 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(dish.id, cartItem.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-[#E5A84B] hover:text-black text-white flex items-center justify-center transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-bold text-white w-6 text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(dish.id, cartItem.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-[#E5A84B] hover:text-black text-white flex items-center justify-center transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          addItem({
                            menuItemId: dish.id,
                            name: dish.name,
                            price: dish.price,
                            quantity: 1,
                            image_url: dish.image_url,
                            is_veg: dish.is_veg
                          });
                          setIsCartOpen(true);
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-[#E5A84B] hover:text-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 flex items-center gap-1.5 border border-white/10 hover:border-[#E5A84B] cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
