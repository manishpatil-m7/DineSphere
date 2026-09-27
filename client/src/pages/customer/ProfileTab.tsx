import React, { useState, useEffect } from 'react';
import { User, Award, MapPin, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';
import axios from 'axios';

interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode: string;
  is_default: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  points: number;
  dietary_pref: string;
  allergies?: string;
  addresses: Address[];
}

export const ProfileTab: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dietaryPref, setDietaryPref] = useState('none');
  const [allergies, setAllergies] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  // New Address State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const data = res.data.data;
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setDietaryPref(data.dietary_pref || 'none');
        setAllergies(data.allergies || '');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingProfile(true);
    setUpdateMsg('');

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/profile`,
        { name, phone, dietary_pref: dietaryPref, allergies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUpdateMsg('Profile updated successfully!');
        setTimeout(() => setUpdateMsg(''), 3000);
        // Also update localStorage user object
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.name = name;
          localStorage.setItem('user', JSON.stringify(u));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingAddress(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/addresses`,
        {
          label: addrLabel,
          line1: addrLine1,
          city: addrCity,
          pincode: addrPincode,
          is_default: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setShowAddAddress(false);
        setAddrLine1('');
        setAddrCity('');
        setAddrPincode('');
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfile();
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        {[1, 2].map(n => (
          <div key={n} className="h-64 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Tier calculation
  const points = profile.points || 0;
  const tier = points > 500 ? 'Gold' : points > 200 ? 'Silver' : 'Bronze';
  const tierColor = tier === 'Gold' ? 'text-amber-400' : tier === 'Silver' ? 'text-slate-300' : 'text-amber-600';

  return (
    <div className="space-y-8">
      {/* Loyalty Card Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b1712] via-[#121212] to-black relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="text-[#E5A84B]" size={20} />
              <span className="text-xs uppercase tracking-widest text-[#E5A84B] font-bold">
                DineSphere Privilege Club
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">{profile.name}</h2>
            <p className="text-xs text-white/60 mt-0.5 font-mono">{profile.email}</p>
            <p className="text-xs text-white/50 mt-3 max-w-md">
              Earn 1 point for every ₹10 spent. Redeem your points directly at checkout for exclusive dining discounts!
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center min-w-[160px]">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">
              Reward Points
            </span>
            <span className="text-3xl font-bold font-mono text-[#E5A84B]">{points}</span>
            <div className="mt-2 text-xs font-semibold">
              Tier: <span className={tierColor}>{tier} Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details & Preferences */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">Personal Details & Dietary Preferences</h3>
        <p className="text-xs text-white/60 mb-6">Our chefs customize seasoning and preparation based on your preferences.</p>

        {updateMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{updateMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
                Dietary Preference
              </label>
              <select
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
              >
                <option value="none" className="bg-[#181818]">No Restrictions</option>
                <option value="veg" className="bg-[#181818]">Vegetarian</option>
                <option value="vegan" className="bg-[#181818]">Vegan</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
                Allergies / Special Notes
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Peanuts, Gluten, Lactose..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50"
          >
            {savingProfile ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Saved Delivery Addresses */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Saved Delivery Addresses</h3>
            <p className="text-xs text-white/60">Quick delivery locations for home or workplace</p>
          </div>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10"
          >
            <Plus size={14} />
            <span>Add Address</span>
          </button>
        </div>

        {showAddAddress && (
          <form onSubmit={handleAddAddress} className="mb-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Label</label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-white/60 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="Flat 4B, Building, Street..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="e.g. 400001"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={savingAddress}
                className="px-4 py-2 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-lg text-xs"
              >
                {savingAddress ? 'Saving...' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-4 py-2 bg-white/5 text-white/70 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {(!profile.addresses || profile.addresses.length === 0) ? (
            <p className="text-xs text-white/40 italic">No saved delivery addresses yet.</p>
          ) : (
            profile.addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#E5A84B] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      {addr.line1}, {addr.city} - {addr.pincode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-white/40 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
