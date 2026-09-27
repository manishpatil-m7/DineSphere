import React, { useState, useEffect } from 'react';
import { Users, Search, Check, X, RefreshCw, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminCustomer } from '../../types/admin';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers({ search: search || undefined });
      if (res.data.success) {
        setCustomers(res.data.data.customers);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCustomerToggle = (id: string) => {
    adminApi.toggleCustomer(id).then(() => fetchCustomers());
  };

  const handleCustomerPoints = (id: string, delta: number, reason: string) => {
    adminApi.adjustCustomerPoints(id, delta, reason).then(() => fetchCustomers());
  };

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Manage your restaurant's guests, loyalty points, and account statuses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-2.5 text-[#D7E2EA]/40" />
        <input
          type="text"
          placeholder="Search by name, email, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
          className="w-full bg-white/[0.04] border border-[#D7E2EA]/20 pl-10 pr-3 py-2.5 rounded-xl text-white outline-none focus:border-[#B600A8] text-sm transition"
        />
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02]">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <Users size={32} className="text-white/20 animate-pulse" />
            <p className="text-sm text-white/50">Loading customer profiles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase tracking-wider font-medium">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Loyalty Points</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">More Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Users size={48} className="text-white/10 mb-4" />
                        <h4 className="text-white font-bold mb-2">No guests found</h4>
                        <p className="text-white/40 text-xs mb-6 max-w-sm">
                          {search ? 'Try adjusting your search filters to find what you are looking for.' : 'No guests have placed orders or registered accounts yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => {
                    const isExpanded = expandedRows[customer.id];
                    return (
                      <React.Fragment key={customer.id}>
                        <tr 
                          className="hover:bg-white/[0.04] transition cursor-pointer group"
                          onClick={() => toggleRow(customer.id)}
                        >
                          <td className="py-3.5 px-4 font-bold text-white/90">
                            {customer.name}
                          </td>
                          <td className="py-3.5 px-4 text-white/70">{customer.email}</td>
                          <td className="py-3.5 px-4 text-white/60">{customer.phone || 'Not provided'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-bold text-[#E5A84B] bg-[#E5A84B]/10 px-2 py-0.5 rounded-full border border-[#E5A84B]/20">
                              {customer.points}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {customer.is_active ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-white/40 group-hover:text-white/80 transition">
                            {isExpanded ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-black/30 border-t-0">
                            <td colSpan={6} className="p-5">
                              <div className="flex flex-col sm:flex-row gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                <div className="flex-1 space-y-3">
                                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Users size={14} className="text-[#B600A8]" /> Guest Profile
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-white/40 block mb-1">Full Name</span>
                                      <span className="text-white">{customer.name}</span>
                                    </div>
                                    <div>
                                      <span className="text-white/40 block mb-1">Email Address</span>
                                      <span className="text-white">{customer.email}</span>
                                    </div>
                                    <div>
                                      <span className="text-white/40 block mb-1">Phone Number</span>
                                      <span className="text-white">{customer.phone || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-white/40 block mb-1">Account ID</span>
                                      <span className="text-white/60 font-mono text-[10px]">{customer.id}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 space-y-3">
                                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-[10px]">Quick Actions</h4>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCustomerPoints(customer.id, 100, 'Admin bonus'); }}
                                      className="flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 transition"
                                    >
                                      <Gift size={14} /> Gift 100 Points
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCustomerToggle(customer.id); }}
                                      className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs transition"
                                    >
                                      {customer.is_active ? 'Disable Account' : 'Reactivate Account'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;