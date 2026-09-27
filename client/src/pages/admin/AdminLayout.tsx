import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  UtensilsCrossed,
  Boxes,
  Grid,
  CalendarDays,
  Users,
  Tag,
  Star,
  HeadphonesIcon,
  Megaphone,
  BarChart3,
  Settings,
  History,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
  Power,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AlertData } from '../../types/admin';

export const AdminLayout: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ orders: any[]; customers: any[]; reservations: any[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const location = useLocation();
  const alertsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Verify Admin Authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        navigate('/admin/login');
      }
    } catch {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Fetch initial alerts and settings
  const fetchAlertsAndSettings = async () => {
    try {
      const [alertsRes, settingsRes] = await Promise.allSettled([
        adminApi.getAlerts(),
        adminApi.getSettings()
      ]);

      if (alertsRes.status === 'fulfilled' && alertsRes.value.data.success) {
        setAlerts(alertsRes.value.data.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data.success) {
        setAcceptingOrders(settingsRes.value.data.data.is_accepting_orders);
      }
    } catch (err) {
      console.error('Failed to load alerts/settings:', err);
    }
  };

  useEffect(() => {
    fetchAlertsAndSettings();
    const interval = setInterval(fetchAlertsAndSettings, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  // Handle Search Input (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.search(searchQuery.trim());
        if (res.data.success) {
          setSearchResults(res.data.data);
          setSearchOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleToggleAccepting = async () => {
    try {
      setToggleLoading(true);
      const nextVal = !acceptingOrders;
      await adminApi.toggleAcceptingOrders(nextVal);
      setAcceptingOrders(nextVal);
    } catch (err) {
      console.error('Failed to toggle accepting orders:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // Nav Groups definition
  const navGroups = [
    {
      name: 'Overview',
      items: [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, end: true }
      ]
    },
    {
      name: 'Operations',
      items: [
        { label: 'Orders', path: '/admin/orders', icon: <ShoppingBag size={18} />, badge: alerts?.new_orders },
        { label: 'Kitchen Display', path: '/admin/kitchen', icon: <ChefHat size={18} /> },
        { label: 'Tables & Floor', path: '/admin/tables', icon: <Grid size={18} /> },
        { label: 'Reservations', path: '/admin/reservations', icon: <CalendarDays size={18} /> }
      ]
    },
    {
      name: 'Catalog',
      items: [
        { label: 'Menu', path: '/admin/menu', icon: <UtensilsCrossed size={18} /> },
        { label: 'Inventory', path: '/admin/inventory', icon: <Boxes size={18} />, badge: alerts?.low_stock },
        { label: 'Coupons', path: '/admin/coupons', icon: <Tag size={18} /> }
      ]
    },
    {
      name: 'People',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: <Users size={18} /> },
        { label: 'Reviews', path: '/admin/reviews', icon: <Star size={18} /> },
        { label: 'Support', path: '/admin/support', icon: <HeadphonesIcon size={18} />, badge: alerts?.open_tickets },
        { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={18} /> }
      ]
    },
    {
      name: 'System',
      items: [
        { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={18} /> },
        { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
        { label: 'Audit Log', path: '/admin/audit-log', icon: <History size={18} /> }
      ]
    }
  ];

  // Open the group containing the active path on mount or path change
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      navGroups.forEach(group => {
        const isActive = group.items.some(item =>
          (item as any).end ? location.pathname === item.path : location.pathname.startsWith(item.path)
        );
        if (isActive) {
          next[group.name] = true;
        }
      });
      // Always ensure Overview is open by default if nothing else is, or just open what's active.
      if (Object.keys(next).length === 0) next['Overview'] = true;
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Helper for current page title
  const getCurrentPageTitle = () => {
    for (const group of navGroups) {
      const current = group.items.find((item) =>
        (item as any).end ? location.pathname === item.path : location.pathname.startsWith(item.path)
      );
      if (current) return current.label;
    }
    return 'Administrator Console';
  };

  const totalAlertsCount =
    (alerts?.new_orders || 0) +
    (alerts?.low_stock || 0) +
    (alerts?.open_tickets || 0);

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#D7E2EA] flex flex-col font-kanit antialiased selection:bg-[#B600A8] selection:text-white">

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Desktop Left Sidebar (w-64) ── */}
        <aside className="w-64 hidden lg:flex flex-col justify-between border-r border-[#D7E2EA]/15 bg-black/60 backdrop-blur-xl shrink-0 z-30">
          <div>
            {/* Logo */}
            <div className="p-6 border-b border-[#D7E2EA]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#B600A8] to-[#7621B0] flex items-center justify-center text-white shadow-lg shadow-[#B600A8]/20">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center">
                    Dine<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B600A8] to-[#BE4C00]">Sphere</span>
                  </h2>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit mt-0.5">
                    Admin Console
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="p-4 space-y-4 max-h-[calc(100vh-170px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {navGroups.map((group) => (
                <div key={group.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#D7E2EA]/50 hover:text-white px-2 py-1 mb-1 transition-colors"
                  >
                    <span>{group.name}</span>
                    {openGroups[group.name] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {openGroups[group.name] && group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={(item as any).end}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-lg shadow-[#B600A8]/25 font-semibold translate-x-1'
                            : 'text-[#D7E2EA]/70 hover:text-white hover:bg-white/[0.04]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {(item as any).badge !== undefined && (item as any).badge > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm animate-pulse">
                          {(item as any).badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>

          {/* Logout bottom */}
          <div className="p-4 border-t border-[#D7E2EA]/10 bg-black/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-sm font-medium cursor-pointer"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </aside>

        {/* ── Mobile Navigation Drawer ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-[#121212] border-r border-[#D7E2EA]/20 flex flex-col justify-between p-6 z-10 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#D7E2EA]/10 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={22} className="text-[#B600A8]" />
                    <span className="font-bold text-lg text-white">DineSphere Admin</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="space-y-4">
                  {navGroups.map((group) => (
                    <div key={group.name} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#D7E2EA]/50 hover:text-white px-2 py-1 mb-1 transition-colors"
                      >
                        <span>{group.name}</span>
                        {openGroups[group.name] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {openGroups[group.name] && group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={(item as any).end}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition ${
                              isActive
                                ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                                : 'text-[#D7E2EA]/70 hover:text-white hover:bg-white/5'
                            }`
                          }
                        >
                          <div className="flex items-center gap-3">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {(item as any).badge !== undefined && (item as any).badge > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                              {(item as any).badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-6 border-t border-[#D7E2EA]/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition text-sm font-medium"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-20 border-b border-[#D7E2EA]/15 bg-black/40 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-white/70 hover:text-white rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.03] cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
              <div className="truncate">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide truncate">
                  {getCurrentPageTitle()}
                </h1>
                <p className="text-[11px] sm:text-xs text-[#D7E2EA]/50 hidden sm:block">
                  DineSphere Management Suite • Live sync enabled
                </p>
              </div>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Global Search */}
              <div className="relative" ref={searchRef}>
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3.5 text-[#D7E2EA]/40" />
                  <input
                    type="text"
                    placeholder="Search orders, customers, code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                    className="w-36 sm:w-64 bg-white/[0.04] border-2 border-[#D7E2EA]/30 focus:border-[#B600A8] pl-10 pr-3 py-2 rounded-2xl text-xs sm:text-sm text-white placeholder:text-[#D7E2EA]/30 outline-none transition"
                  />
                </div>

                {/* Search Results Dropdown */}
                {searchOpen && searchResults && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161616] border border-[#D7E2EA]/30 rounded-3xl shadow-2xl p-4 z-50 max-h-96 overflow-y-auto backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D7E2EA]/10 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D7E2EA]/60">
                        Search Results
                      </span>
                      <button
                        onClick={() => setSearchOpen(false)}
                        className="text-xs text-[#D7E2EA]/40 hover:text-white"
                      >
                        Close
                      </button>
                    </div>

                    {/* Orders Match */}
                    <div className="mb-3">
                      <div className="text-[10px] uppercase font-mono text-[#B600A8] font-bold mb-1">Orders</div>
                      {searchResults.orders.length === 0 ? (
                        <div className="text-xs text-white/40 italic pl-2">No matching orders</div>
                      ) : (
                        searchResults.orders.map((o) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              navigate('/admin/orders');
                              setSearchOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs flex justify-between items-center transition"
                          >
                            <span className="font-mono text-white">#{o.id.slice(0, 8)}</span>
                            <span className="text-emerald-400 font-semibold">₹{o.total}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">{o.status}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Customers Match */}
                    <div className="mb-3">
                      <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold mb-1">Customers</div>
                      {searchResults.customers.length === 0 ? (
                        <div className="text-xs text-white/40 italic pl-2">No matching customers</div>
                      ) : (
                        searchResults.customers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              navigate('/admin/customers');
                              setSearchOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs flex justify-between items-center transition"
                          >
                            <span className="text-white font-medium">{c.name}</span>
                            <span className="text-white/40 font-mono text-[11px]">{c.email}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reservations Match */}
                    <div>
                      <div className="text-[10px] uppercase font-mono text-amber-400 font-bold mb-1">Reservations</div>
                      {searchResults.reservations.length === 0 ? (
                        <div className="text-xs text-white/40 italic pl-2">No matching reservations</div>
                      ) : (
                        searchResults.reservations.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              navigate('/admin/reservations');
                              setSearchOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs flex justify-between items-center transition"
                          >
                            <span className="font-mono text-amber-300 font-bold">{r.code}</span>
                            <span className="text-white/60">{r.date} ({r.time_slot})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Accepting Orders Toggle Switch */}
              <button
                onClick={handleToggleAccepting}
                disabled={toggleLoading}
                title="Toggle live customer order acceptance"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition text-xs font-semibold cursor-pointer ${
                  acceptingOrders
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                <Power size={14} className={acceptingOrders ? 'animate-pulse' : ''} />
                <span className="hidden md:inline">Orders:</span>
                <span>{acceptingOrders ? 'ON' : 'PAUSED'}</span>
              </button>

              {/* Alerts Bell Dropdown */}
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className="relative p-2.5 rounded-2xl border border-[#D7E2EA]/30 bg-white/[0.04] hover:bg-white/[0.08] text-white transition cursor-pointer"
                  aria-label="View system alerts"
                >
                  <Bell size={18} />
                  {totalAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
                      {totalAlertsCount}
                    </span>
                  )}
                </button>

                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl shadow-2xl p-5 z-50 backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D7E2EA]/10 mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-400" />
                        <h3 className="font-bold text-white text-sm">Action Center & Alerts</h3>
                      </div>
                      <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                        {totalAlertsCount} active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* New Orders Alert */}
                      <div
                        onClick={() => {
                          navigate('/admin/orders');
                          setAlertsOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#B600A8]/40 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#B600A8]/20 text-[#B600A8] flex items-center justify-center font-bold">
                            <ShoppingBag size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">New Placed Orders</div>
                            <div className="text-[11px] text-white/50">Orders awaiting kitchen prep</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#B600A8] font-mono">
                          {alerts?.new_orders || 0}
                        </span>
                      </div>

                      {/* Low Stock Alert */}
                      <div
                        onClick={() => {
                          navigate('/admin/inventory');
                          setAlertsOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                              <Boxes size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">Low Stock Ingredients</div>
                              <div className="text-[11px] text-white/50">Items below reorder threshold</div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            {alerts?.low_stock || 0}
                          </span>
                        </div>
                        {alerts?.low_stock_items && alerts.low_stock_items.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                            {alerts.low_stock_items.map((item) => (
                              <div key={item.id} className="text-[11px] flex justify-between text-white/70">
                                <span className="truncate pr-2">• {item.name}</span>
                                <span className="font-mono text-amber-300 font-bold shrink-0">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Open Support Tickets */}
                      <div
                        onClick={() => {
                          navigate('/admin/support');
                          setAlertsOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                            <HeadphonesIcon size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Open Support Tickets</div>
                            <div className="text-[11px] text-white/50">Customers requesting assistance</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-cyan-400 font-mono">
                          {alerts?.open_tickets || 0}
                        </span>
                      </div>

                      {/* Today's Reservations */}
                      <div
                        onClick={() => {
                          navigate('/admin/reservations');
                          setAlertsOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <CalendarDays size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Today's Bookings</div>
                            <div className="text-[11px] text-white/50">Confirmed table reservations</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {alerts?.todays_reservations || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Avatar & Logout */}
              <div className="flex items-center gap-3 pl-2 border-l border-[#D7E2EA]/15">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#BE4C00] to-[#E5A84B] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight">Administrator</div>
                  <div className="text-[10px] font-mono text-[#D7E2EA]/50">Super User</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out of Admin Console"
                  className="p-2 text-[#D7E2EA]/60 hover:text-red-400 rounded-xl hover:bg-white/[0.04] transition cursor-pointer"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content Outlet */}
          <main className="flex-1 p-4 sm:p-8 min-w-0 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
export default AdminLayout;
