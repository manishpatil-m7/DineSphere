import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  UtensilsCrossed, ShoppingBag, Calendar, Heart, User, LifeBuoy, 
  Bell, LogOut, Menu, X, ChevronRight, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

import { useCartStore } from '../../store/cartStore';
import { CartDrawer } from './CartDrawer';
import { MenuTab } from './MenuTab';
import { OrdersTab } from './OrdersTab';
import { ReservationsTab } from './ReservationsTab';
import { FavoritesTab } from './FavoritesTab';
import { ProfileTab } from './ProfileTab';
import { SupportTab } from './SupportTab';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const CustomerPortal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'menu';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  const navigate = useNavigate();
  const { items, isCartOpen, setIsCartOpen, orderType, setOrderType, tableNumber, setTableNumber } = useCartStore();

  const totalCartCount = items.reduce((sum, it) => sum + it.quantity, 0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch {}
  };

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { id: 'menu', label: 'Menu & Order', icon: UtensilsCrossed },
    { id: 'orders', label: 'Live Orders & History', icon: ShoppingBag },
    { id: 'reservations', label: 'Table Reservations', icon: Calendar },
    { id: 'favorites', label: 'Favorite Dishes', icon: Heart },
    { id: 'profile', label: 'Privilege & Profile', icon: User },
    { id: 'support', label: 'Guest Support', icon: LifeBuoy }
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#D7E2EA] flex font-kanit antialiased selection:bg-[#E5A84B] selection:text-black">
      {/* ── Left Sidebar (Desktop) ── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-[#101010]/80 backdrop-blur-xl shrink-0 sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <Link to="/intro" className="text-2xl font-bold text-white tracking-wide block">
            Dine<span className="text-[#E5A84B]">Sphere</span>
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-[#E5A84B] font-semibold mt-1 block">
            Customer Portal
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#E5A84B] text-black shadow-lg shadow-[#E5A84B]/20 font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E5A84B]/20 border border-[#E5A84B]/40 flex items-center justify-center text-[#E5A84B] font-bold text-xs">
                {user?.name?.[0] || 'C'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Customer'}</p>
                <p className="text-[10px] text-white/50 truncate font-mono">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-white/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Layout (Content + Header) ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-18 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
          {/* Mobile menu toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 text-white/70 hover:text-white"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white tracking-wide capitalize">
                {navLinks.find(l => l.id === activeTab)?.label}
              </h1>
            </div>
          </div>

          {/* Quick Dining Controls & Action Badges */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Dining Mode Quick Pill */}
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              {(['Dine-in', 'Takeaway', 'Delivery'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    orderType === type
                      ? 'bg-[#E5A84B] text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161616] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      Notifications
                    </span>
                    <span className="text-[10px] text-white/50">{notifications.length} total</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-white/40 py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer ${
                            n.is_read
                              ? 'bg-white/[0.02] border-white/5 text-white/60'
                              : 'bg-[#E5A84B]/10 border-[#E5A84B]/30 text-white'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs">{n.title}</span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#E5A84B] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] mt-1 text-white/70">{n.message}</p>
                          <span className="text-[9px] text-white/40 mt-1 block font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition duration-200 flex items-center gap-2 shadow-lg shadow-[#E5A84B]/15 cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-black text-[#E5A84B] px-1.5 py-0.5 rounded-full font-mono text-[11px] font-bold">
                {totalCartCount}
              </span>
            </button>

            {/* Quick Home Link */}
            <Link
              to="/intro"
              className="hidden sm:inline-flex px-3 py-2 border border-white/10 hover:border-white/30 text-white/70 hover:text-white rounded-xl text-xs font-medium transition"
            >
              Main Site &rarr;
            </Link>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
          {activeTab === 'menu' && <MenuTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'reservations' && <ReservationsTab />}
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'support' && <SupportTab />}
        </main>
      </div>

      {/* ── Slide-over Cart Drawer ── */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(orderId) => {
          handleTabChange('orders');
        }}
      />

      {/* ── Mobile Navigation Drawer ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm lg:hidden animate-fadeIn">
          <div className="w-72 bg-[#121212] border-r border-white/10 h-full p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
              <div>
                <Link to="/intro" className="text-xl font-bold text-white tracking-wide">
                  Dine<span className="text-[#E5A84B]">Sphere</span>
                </Link>
                <span className="text-[10px] uppercase tracking-widest text-[#E5A84B] block font-semibold">
                  Customer Portal
                </span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                      isActive
                        ? 'bg-[#E5A84B] text-black font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-red-500/20"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
