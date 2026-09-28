import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface AuthConfig {
  dev_mode: boolean;
  admin_id?: string;
  admin_password?: string;
}

const AdminLogin: React.FC = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/admin/login`, {
        email: adminId,
        password
      });

      const user = res.data.data.user;

      localStorage.setItem('adminToken', res.data.data.token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admin authentication failed');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0C0C0C]">
      <div className="glass-card p-8 w-full max-w-md relative z-10 border border-white/10 rounded-2xl bg-white/[0.04]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#E5A84B]/15 text-[#E5A84B] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-2xl font-bold mb-1 text-white">Staff & Admin Access</h2>
          <p className="text-[#D7E2EA]/60 text-xs">Enter your administrator credentials to proceed</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-xl mb-6 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 text-[#D7E2EA]/80 font-medium">
              Admin ID or Email
            </label>
            <input 
              type="text" 
              required 
              placeholder="admin or admin@dinesphere.test"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#E5A84B] transition"
              value={adminId}
              onChange={e => setAdminId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 text-[#D7E2EA]/80 font-medium">
              Password
            </label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#E5A84B] transition"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-[#E5A84B] text-black font-bold rounded-xl hover:bg-white transition duration-200 mt-2 text-sm uppercase tracking-wider cursor-pointer"
          >
            Access Admin Dashboard
          </button>
        </form>


        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Back to customer login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
