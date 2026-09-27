import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import type { AdminSettings } from '../../types/admin';
import { Save, Check, AlertCircle, RefreshCw } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getSettings();
      if (res.data?.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setErrorMessage('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = <K extends keyof AdminSettings>(field: K, value: AdminSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !settings) return;
    try {
      setSaving(true);
      setToastMessage(null);
      setErrorMessage(null);
      const res = await adminApi.updateSettings(settings);
      if (res.data?.success) {
        setToastMessage('Settings saved successfully!');
        if (res.data.data) {
          setSettings(res.data.data);
        }
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Settings</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Configure restaurant operational parameters, reservations, taxes, and loyalty points
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:text-white transition cursor-pointer"
            title="Reload Settings"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !settings}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#B600A8]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 rounded-3xl border border-[#D7E2EA]/15 bg-white/[0.02] flex items-center justify-center">
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <RefreshCw size={20} className="animate-spin text-[#B600A8]" />
            Loading settings...
          </div>
        </div>
      ) : settings ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Restaurant Information */}
          <div className="p-6 rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
              General Restaurant Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurant_name || ''}
                  onChange={(e) => handleChange('restaurant_name', e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  placeholder="e.g. DineSphere Bistro"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  placeholder="123 Culinary Boulevard, Foodville"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Taxes & Loyalty */}
            <div className="p-6 rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
                Billing & Loyalty Points
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={settings.tax_percent ?? 5}
                    onChange={(e) => handleChange('tax_percent', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  />
                  <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Applied to order subtotal</span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                    Points Per Rupee Spent
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.points_per_rupees ?? 1}
                    onChange={(e) => handleChange('points_per_rupees', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  />
                  <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Reward points earned per ₹1 paid</span>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.is_accepting_orders ?? true}
                      onChange={(e) => handleChange('is_accepting_orders', e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#B600A8] focus:ring-[#B600A8] cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-white">Accepting Orders</span>
                      <p className="text-[11px] text-[#D7E2EA]/50">Enable or disable placing new customer orders</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Reservations Rules */}
            <div className="p-6 rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
                Reservation Parameters
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                      Max Days Ahead
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={settings.max_days_ahead ?? 14}
                      onChange={(e) => handleChange('max_days_ahead', parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                    <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Max advance booking window</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                      Hold Minutes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.hold_minutes ?? 5}
                      onChange={(e) => handleChange('hold_minutes', parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                    <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Seat hold duration during checkout</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                      Cancel Window (Hours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={72}
                      value={settings.cancel_window_hours ?? 2}
                      onChange={(e) => handleChange('cancel_window_hours', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                    <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Hours before slot to allow cancel</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#D7E2EA]/60 uppercase tracking-wider mb-2">
                      Max Tables / Booking
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.max_tables_per_booking ?? 4}
                      onChange={(e) => handleChange('max_tables_per_booking', parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-[#D7E2EA]/20 px-4 py-2.5 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                    />
                    <span className="text-[11px] text-[#D7E2EA]/40 mt-1 block">Per single reservation order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {/* Footer Info */}
      <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-xs text-[#D7E2EA]/40">
        Admin security credentials and database connectivity are configured via the server environment files.
      </div>
    </div>
  );
};

export default SettingsPage;