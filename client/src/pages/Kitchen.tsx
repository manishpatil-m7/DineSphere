import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  orderNumber: number;
  type: string;
  status: string;
  specialInstructions: string | null;
  items: any[];
  createdAt: string;
}

const Kitchen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/login');
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
      // Fallback mock data
      if (orders.length === 0) {
        setOrders([
          { id: '1', orderNumber: 101, type: 'DINE_IN', status: 'PENDING', specialInstructions: 'No onions', createdAt: new Date().toISOString(), items: [{ quantity: 1, menuItem: { name: 'Truffle Fries' } }] },
          { id: '2', orderNumber: 102, type: 'DELIVERY', status: 'PREPARING', specialInstructions: null, createdAt: new Date().toISOString(), items: [{ quantity: 2, menuItem: { name: 'Grilled Ribeye' } }] }
        ]);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      // Optimistic update for mock
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    }
  };

  const pending = orders.filter(o => o.status === 'PENDING');
  const preparing = orders.filter(o => o.status === 'PREPARING');
  const ready = orders.filter(o => o.status === 'READY');

  const Column = ({ title, color, list }: { title: string, color: string, list: Order[] }) => (
    <div className="flex-1 min-w-[300px] glass-card p-4 h-[80vh] overflow-y-auto">
      <h2 className={`text-xl font-bold mb-4 flex items-center justify-between ${color}`}>
        {title} <span className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">{list.length}</span>
      </h2>
      <div className="space-y-4">
        {list.map(order => (
          <div key={order.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
              <span className="font-bold text-lg">#{order.orderNumber}</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">{order.type}</span>
            </div>
            <ul className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-bold text-gold">{item.quantity}x</span> {item.menuItem?.name || 'Item'}
                </li>
              ))}
            </ul>
            {order.specialInstructions && (
              <p className="text-xs text-warningAmber bg-warningAmber/10 p-2 rounded mb-4">
                Note: {order.specialInstructions}
              </p>
            )}
            
            <div className="flex gap-2 mt-4">
              {order.status === 'PENDING' && (
                <button onClick={() => updateStatus(order.id, 'PREPARING')} className="flex-1 bg-gold text-darkBrown py-2 rounded font-bold text-sm hover:bg-white transition">Accept</button>
              )}
              {order.status === 'PREPARING' && (
                <button onClick={() => updateStatus(order.id, 'READY')} className="flex-1 bg-successGreen text-white py-2 rounded font-bold text-sm hover:opacity-80 transition flex justify-center items-center gap-1"><CheckCircle size={16}/> Ready</button>
              )}
              {order.status === 'READY' && (
                <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="flex-1 border border-white/20 text-cream py-2 rounded font-bold text-sm hover:bg-white/10 transition">Complete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-charcoal">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Kitchen <span className="text-gold">Dashboard</span></h1>
        <div className="flex items-center gap-2 text-cream/50 text-sm">
          <Clock size={16} /> Auto-updating every 10s
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4">
        <Column title="Pending" color="text-errorRed" list={pending} />
        <Column title="Preparing" color="text-warningAmber" list={preparing} />
        <Column title="Ready" color="text-successGreen" list={ready} />
      </div>
    </div>
  );
};

export default Kitchen;
