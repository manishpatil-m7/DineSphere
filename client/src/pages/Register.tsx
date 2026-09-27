import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      return setError('Passwords do not match');
    }
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-charcoal/90 backdrop-blur-md"></div>
      
      <div className="glass-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-cream/60">Join DineSphere today</p>
        </div>

        {error && <div className="bg-errorRed/20 border border-errorRed text-errorRed p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-cream/80">Full Name</label>
            <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cream/80">Email</label>
            <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cream/80">Phone</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cream/80">Password</label>
            <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cream/80">Confirm Password</label>
            <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-gold"
              value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3 bg-gold text-darkBrown font-bold rounded-lg hover:bg-white transition mt-4">
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-cream/60">
          Already have an account? <Link to="/login" className="text-gold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
