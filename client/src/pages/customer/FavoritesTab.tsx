import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, ShoppingBag } from 'lucide-react';
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
}

export const FavoritesTab: React.FC = () => {
  const [favorites, setFavorites] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, setIsCartOpen } = useCartStore();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFavorites(res.data.data);
      }
    } catch (err) {
      console.error('Favorites fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (dishId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/favorites/${dishId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFavorites(prev => prev.filter(f => f.id !== dishId));
      }
    } catch (err) {
      console.error('Remove favorite error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Your Favorite Dishes</h2>
          <p className="text-xs text-white/60 mt-1">Dishes you've bookmarked for quick reordering</p>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/80 font-mono">
          {favorites.length} saved
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
          <Heart size={44} className="mx-auto mb-3 text-white/20" />
          <p className="font-bold text-white text-base">No favorites added yet</p>
          <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
            Browse our menu and tap the heart icon on any dish to save it here for fast ordering.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((dish) => (
            <div
              key={dish.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#E5A84B]/40 transition duration-300 flex flex-col"
            >
              <div className="h-40 relative bg-white/5">
                <img
                  src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleRemoveFavorite(dish.id)}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-red-400 hover:scale-110 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white/80 border border-white/15">
                  {dish.category}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{dish.name}</h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1">{dish.description}</p>
                </div>

                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-[#E5A84B]">₹{dish.price}</span>
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
                    className="px-3.5 py-1.5 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
