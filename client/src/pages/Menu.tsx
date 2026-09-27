import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { ShoppingBag, Filter, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVegetarian: boolean;
  categoryId: string;
  category: { id: string, name: string };
  image: string | null;
}

const Menu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterVeg, setFilterVeg] = useState(false);
  
  const cartStore = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // In a real environment we'd fetch from http://localhost:5000/api/menu
        // For fallback we'll mock if API fails
        const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/menu`);
        setItems(res.data.data);
        setLoading(false);
      } catch (err) {
        console.warn("API not reachable, using mock data");
        setItems([
          { id: '1', name: 'Truffle Fries', description: 'Crispy fries with truffle oil', price: 8.99, isVegetarian: true, categoryId: 'c1', category: { id: 'c1', name: 'Starters' }, image: null },
          { id: '2', name: 'Grilled Ribeye', description: '10oz steak', price: 34.99, isVegetarian: false, categoryId: 'c2', category: { id: 'c2', name: 'Mains' }, image: null },
          { id: '3', name: 'Lava Cake', description: 'Warm chocolate cake', price: 9.99, isVegetarian: true, categoryId: 'c3', category: { id: 'c3', name: 'Desserts' }, image: null }
        ]);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    cartStore.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  };

  const filteredItems = items.filter(item => {
    if (filterVeg && !item.isVegetarian) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Our <span className="text-gold">Menu</span></h1>
        <button 
          onClick={() => navigate('/cart')}
          className="relative glass-card p-3 hover:bg-white/10 transition"
        >
          <ShoppingBag className="text-gold" />
          {cartStore.items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-errorRed text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
              {cartStore.items.reduce((acc, curr) => acc + curr.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 text-cream/50" size={20} />
          <input 
            type="text" 
            placeholder="Search dishes..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-gold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setFilterVeg(!filterVeg)}
          className={`px-6 py-2 rounded-full border ${filterVeg ? 'bg-successGreen border-successGreen' : 'border-white/20 hover:border-gold'} transition`}
        >
          <Filter size={18} className="inline mr-2" /> Veg Only
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card h-64 animate-pulse bg-white/5"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-cream/50">No menu items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="glass-card p-5 flex flex-col">
              <div className="h-40 w-full bg-charcoal/50 rounded-xl mb-4 flex items-center justify-center text-cream/20">
                [ Image Placeholder ]
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                {item.isVegetarian && <span className="bg-successGreen/20 text-successGreen text-xs px-2 py-1 rounded">Veg</span>}
              </div>
              <p className="text-sm text-cream/60 flex-grow mb-4">{item.description}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-2xl font-bold text-gold">${item.price.toFixed(2)}</span>
                <button 
                  onClick={() => handleAddToCart(item)}
                  className="bg-gold text-charcoal p-2 rounded-full hover:scale-110 transition shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
