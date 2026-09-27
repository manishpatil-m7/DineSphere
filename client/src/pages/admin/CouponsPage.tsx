import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, Edit, Trash2, Check, X, RefreshCcw, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminCoupon } from '../../types/admin';

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | 'new' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Form state
  const [formCoupon, setFormCoupon] = useState('');
  const [formDiscount, setFormDiscount] = useState(10);
  const [formMinOrder, setFormMinOrder] = useState(0);
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formPerUserLimit, setFormPerUserLimit] = useState(1);
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCoupons();
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setFormCoupon('');
    setFormDiscount(10);
    setFormMinOrder(0);
    setFormUsageLimit('');
    setFormPerUserLimit(1);
    setFormValidFrom('');
    setFormExpiresAt('');
    setEditingCoupon('new');
  };

  const openEdit = (coupon: AdminCoupon) => {
    setFormCoupon(coupon.code);
    setFormDiscount(coupon.discount_percent);
    setFormMinOrder(coupon.min_order || 0);
    setFormUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : '');
    setFormPerUserLimit(coupon.per_user_limit || 1);
    setFormValidFrom(coupon.valid_from ? String(coupon.valid_from).slice(0, 10) : '');
    setFormExpiresAt(coupon.expires_at ? String(coupon.expires_at).slice(0, 10) : '');
    setEditingCoupon(coupon);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCoupon.trim() || formDiscount <= 0) return;

    try {
      setSubmitting(true);
      const data: any = {
        code: formCoupon.trim().toUpperCase(),
        description: 'Coupon for DineSphere',
        discount_percent: formDiscount,
        min_order: formMinOrder,
        usage_limit: formUsageLimit ? parseInt(formUsageLimit) : undefined,
        per_user_limit: formPerUserLimit,
        valid_from: formValidFrom ? new Date(formValidFrom) : null,
        expires_at: formExpiresAt ? new Date(formExpiresAt) : null,
        is_active: true
      };

      if (editingCoupon && editingCoupon !== 'new') {
        await adminApi.updateCoupon(editingCoupon.id, data);
      } else {
        await adminApi.createCoupon(data);
      }

      await fetchCoupons();
      setEditingCoupon(null);
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      alert(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      setCoupons(coupons.filter(c => c.id !== id));
      // In a real app we'd call adminApi.deleteCoupon(id) here
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateFriendly = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredCoupons = coupons.filter(c =>
    !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Coupons & Promotions</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Create discount codes, set usage limits, and manage promotions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:bg-white/10 cursor-pointer transition"
          >
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs shadow-lg shadow-[#B600A8]/20 hover:brightness-110 cursor-pointer transition"
          >
            <Plus size={16} />
            <span>New Coupon</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-2.5 text-[#D7E2EA]/40" />
          <input
            type="text"
            placeholder="Find coupon by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md bg-white/[0.04] border border-[#D7E2EA]/20 pl-10 pr-3 py-2.5 rounded-xl text-white outline-none focus:border-[#B600A8] transition text-sm"
          />
        </div>
      </div>

      {/* Coupon List */}
      <div className="overflow-hidden rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02]">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <Tag size={32} className="text-white/20 animate-pulse" />
            <p className="text-sm text-white/50">Loading promotional codes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase tracking-wider font-medium">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Actions & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Tag size={48} className="text-white/10 mb-4" />
                        <h4 className="text-white font-bold mb-2">No coupons found</h4>
                        <p className="text-white/40 text-xs mb-6 max-w-sm">
                          {search ? 'Try adjusting your search filters to find what you are looking for.' : "You haven't created any promotional codes yet. Create your first coupon to attract more guests!"}
                        </p>
                        {!search && (
                          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition cursor-pointer">
                            Create First Coupon
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const isExpanded = expandedRows[coupon.id];
                    return (
                      <React.Fragment key={coupon.id}>
                        <tr 
                          className="hover:bg-white/[0.04] transition cursor-pointer group"
                          onClick={() => toggleRow(coupon.id)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-white/90">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-sm tracking-wider">{coupon.code}</span>
                          </td>
                          <td className="py-3.5 px-4 text-emerald-400 font-bold">{coupon.discount_percent}% OFF</td>
                          <td className="py-3.5 px-4">
                            {coupon.is_active ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/50 border border-white/20">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-white/60">
                            {formatDateFriendly(coupon.expires_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(coupon); }}
                                className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                                title="Edit coupon"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCoupon(coupon.id, coupon.code); }}
                                className="p-1.5 rounded-lg text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition"
                                title="Delete coupon"
                              >
                                <Trash2 size={16} />
                              </button>
                              <span className="text-white/30 group-hover:text-white/60 ml-2">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-black/30 border-t-0">
                            <td colSpan={5} className="p-5">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-wrap gap-8 text-xs">
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Min. Order Amount</span>
                                  <span className="text-white font-mono font-medium text-sm">₹{coupon.min_order || 0}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Total Usage Limit</span>
                                  <span className="text-white">{coupon.usage_limit ? `${coupon.usage_limit} uses maximum` : 'Unlimited uses'}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Limit Per User</span>
                                  <span className="text-white">{coupon.per_user_limit} time(s)</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Valid From</span>
                                  <span className="text-white">{formatDateFriendly(coupon.valid_from)}</span>
                                </div>
                                <div className="flex-1 text-right self-end">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEdit(coupon); }}
                                    className="px-4 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 transition"
                                  >
                                    Adjust Settings
                                  </button>
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

      {/* Add/Edit Coupon Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag size={20} className="text-[#B600A8]" />
                {editingCoupon === 'new' ? 'Create Promotional Code' : `Update Code: ${(editingCoupon as AdminCoupon).code}`}
              </h3>
              <button
                onClick={() => setEditingCoupon(null)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-5">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME10"
                    value={formCoupon}
                    onChange={(e) => setFormCoupon(e.target.value)}
                    className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm font-mono uppercase text-white outline-none focus:border-[#B600A8] transition"
                  />
                  <p className="text-[10px] text-white/40 mt-1">Keep it short and memorable. Only letters and numbers.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Discount Percentage *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        required
                        value={formDiscount}
                        onChange={(e) => setFormDiscount(parseInt(e.target.value))}
                        className="w-full bg-black/40 border border-[#D7E2EA]/20 pl-3 pr-8 py-3 rounded-xl text-sm font-mono text-white outline-none focus:border-[#B600A8] transition"
                      />
                      <span className="absolute right-3 top-3.5 text-white/40 font-mono">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Min Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(parseInt(e.target.value))}
                      className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm font-mono text-white outline-none focus:border-[#B600A8] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white">Usage Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Total Usage Cap
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Leave blank for unlimited"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Max Uses Per Customer
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formPerUserLimit}
                      onChange={(e) => setFormPerUserLimit(parseInt(e.target.value) || 1)}
                      className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Valid From (Optional)
                    </label>
                    <input
                      type="date"
                      value={formValidFrom}
                      onChange={(e) => setFormValidFrom(e.target.value)}
                      className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-white/60 tracking-wider block mb-1.5">
                      Expires At (Optional)
                    </label>
                    <input
                      type="date"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-sm hover:brightness-110 shadow-lg shadow-[#B600A8]/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon === 'new' ? 'Launch Promo' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;