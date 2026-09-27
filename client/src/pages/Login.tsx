import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface AuthConfig {
  dev_mode: boolean;
  admin_id?: string;
  admin_password?: string;
  demo_email?: string;
  demo_password?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      
      const role = res.data.data.user.role;
      if (role === 'ADMIN' || role === 'MANAGER') {
        navigate('/admin');
      } else if (role === 'KITCHEN') {
        navigate('/kitchen');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Note: Ensure the backend is running.');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0C0C0C]">
      <div className="glass-card p-8 w-full max-w-md relative z-10 border border-white/10 rounded-2xl bg-white/[0.04]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-white">Welcome Back</h2>
          <p className="text-[#D7E2EA]/60 text-sm">Log in to your DineSphere account</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-xl mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 text-[#D7E2EA]/80 font-medium">
              Email
            </label>
            <input 
              type="text" 
              required 
              placeholder="customer@dinesphere.test"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#E5A84B] transition"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
            className="w-full py-3 bg-[#E5A84B] text-black font-bold rounded-xl hover:bg-white transition duration-200 mt-2 text-sm uppercase tracking-wider"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#D7E2EA]/60">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#E5A84B] hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
