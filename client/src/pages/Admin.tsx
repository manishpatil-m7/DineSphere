import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, ShoppingBag, TrendingUp, LogOut, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, todayRevenue: 0, totalOrders: 0, todayOrders: 0 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mock data for the chart
  const data = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        // Customer cannot open /admin
        setAuthError('Access Denied: You do not have administrator permissions to view this dashboard.');
        setLoading(false);
        return;
      }
    } catch {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [salesRes, customersRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/reports/sales`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/admin/customers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (salesRes.status === 'fulfilled') {
          setStats(salesRes.value.data.data);
        } else {
          setStats({ totalRevenue: 24500, todayRevenue: 1200, totalOrders: 850, todayOrders: 42 });
        }

        if (customersRes.status === 'fulfilled') {
          setCustomers(customersRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl border border-red-500/30 bg-red-500/10 text-white">
          <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-white/70 text-sm mb-6">{authError}</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-[#E5A84B] text-black font-semibold rounded-lg text-sm hover:bg-white transition"
            >
              Go to Customer Dashboard
            </Link>
            <Link
              to="/admin/login"
              className="px-5 py-2.5 border border-white/20 text-white rounded-lg text-sm hover:bg-white/10 transition"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) => (
    <div className="glass-card p-6 flex flex-col border border-white/10 rounded-2xl bg-white/[0.03]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl text-[#E5A84B]">{icon}</div>
        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">{trend}</span>
      </div>
      <h3 className="text-white/60 text-xs uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#D7E2EA] flex font-kanit">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 bg-black/40 p-6 hidden md:flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">
            Dine<span className="text-[#E5A84B]">Sphere</span>
          </h2>
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded block w-fit mb-6">
            Admin Console
          </span>
          <nav className="space-y-2">
            <a href="#overview" className="flex items-center gap-3 text-[#E5A84B] bg-[#E5A84B]/10 px-3.5 py-2.5 rounded-xl font-medium text-sm">
              <TrendingUp size={18} /> Dashboard
            </a>
            <a href="#customers" className="flex items-center gap-3 text-white/60 hover:text-white px-3.5 py-2.5 rounded-xl text-sm transition">
              <Users size={18} /> Customers
            </a>
            <a href="#orders" className="flex items-center gap-3 text-white/60 hover:text-white px-3.5 py-2.5 rounded-xl text-sm transition">
              <ShoppingBag size={18} /> Orders
            </a>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60 hover:text-white border border-white/10 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Administrator Dashboard</h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">Live metrics, customer management, and sales reporting</p>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center gap-2 text-xs text-white/70 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <LogOut size={14} /> Exit
          </button>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={<DollarSign size={20} />} trend="+12.5%" />
          <StatCard title="Today's Revenue" value={`$${stats.todayRevenue.toFixed(2)}`} icon={<DollarSign size={20} />} trend="+5.2%" />
          <StatCard title="Total Orders" value={`${stats.totalOrders}`} icon={<ShoppingBag size={20} />} trend="+8.1%" />
          <StatCard title="Today's Orders" value={`${stats.todayOrders}`} icon={<ShoppingBag size={20} />} trend="-2.4%" />
        </div>

        {/* Revenue Chart */}
        <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6 mb-8 h-[360px]">
          <h2 className="text-lg font-bold text-white mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5A84B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E5A84B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} />
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff20', borderRadius: '8px' }}
                itemStyle={{ color: '#E5A84B' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#E5A84B" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Customers Table (Shows Demo Customer) ── */}
        <div id="customers" className="border border-white/10 rounded-2xl bg-white/[0.03] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-[#E5A84B]" />
              <h2 className="text-lg font-bold text-white">Registered Customers</h2>
            </div>
            <span className="text-xs text-white/50">
              {customers.length} customer{customers.length === 1 ? '' : 's'} registered
            </span>
          </div>

          {customers.length === 0 ? (
            <p className="text-sm text-white/50 py-4">No customers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.email === 'demo@dinesphere.test' && (
                          <span className="text-[10px] font-mono uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                            Demo Account
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/70 font-mono text-xs">{c.email}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono uppercase bg-white/10 text-white/80 px-2 py-0.5 rounded">
                          {c.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/50 text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
