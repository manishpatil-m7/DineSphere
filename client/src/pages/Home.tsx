import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Placeholder */}
      <nav className="w-full p-6 flex justify-between items-center glass-card sticky top-0 z-50">
        <h2 className="text-2xl font-bold">Dine<span className="text-gold">Sphere</span></h2>
        <div className="space-x-6 hidden md:block">
          <button onClick={() => navigate('/menu')} className="hover:text-gold transition">Menu</button>
          <button onClick={() => navigate('/reservations')} className="hover:text-gold transition">Reservations</button>
          <button onClick={() => navigate('/about')} className="hover:text-gold transition">About</button>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Taste the <span className="text-gold">Extraordinary</span></h1>
            <p className="text-lg md:text-xl text-cream/80 mb-10">Discover a culinary journey where tradition meets modern innovation.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/menu')} className="px-8 py-3 bg-gold text-darkBrown font-bold rounded-full hover:bg-white transition-colors">
                Order Now
              </button>
              <button onClick={() => navigate('/reservations')} className="px-8 py-3 border border-white rounded-full hover:bg-white/10 transition-colors">
                Book a Table
              </button>
            </div>
          </div>
        </section>

        {/* Featured Section placeholder */}
        <section className="py-20 px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Signature Dishes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Example Card */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-full bg-charcoal mb-6 border-4 border-gold shadow-lg flex items-center justify-center">
                  <span className="text-gold opacity-50">Image {i}</span>
                </div>
                <h4 className="text-xl font-bold mb-2">Signature Item {i}</h4>
                <p className="text-cream/70 text-sm mb-4">A delicious description of this amazing culinary creation.</p>
                <span className="text-gold font-bold">$24.99</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black/50 py-8 text-center text-sm text-cream/50">
        <p>&copy; 2026 DineSphere Restaurant. College Project Demo.</p>
      </footer>
    </div>
  );
};

export default Home;
