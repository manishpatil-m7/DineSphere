import { Link } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import HeroSection from '../sections/HeroSection';
import MarqueeSection from '../sections/MarqueeSection';
import AboutSection from '../sections/AboutSection';
import FeaturesSection from '../sections/FeaturesSection';
import ModulesSection from '../sections/ModulesSection';

const Intro = () => (
  <main className="w-full max-w-full overflow-x-hidden min-h-screen">
    <HeroSection />
    <MarqueeSection />
    <AboutSection />
    <FeaturesSection />
    <ModulesSection />

    {/* ── Intro Page Footer with Portal Quick Access ── */}
    <footer className="bg-[#080808] border-t border-white/10 py-12 px-6 md:px-10 text-center relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-bold text-white tracking-wider">
            Dine<span className="text-[#E5A84B]">Sphere</span>
          </h3>
          <p className="text-xs text-[#D7E2EA]/50 mt-1">Smart Restaurant Management Platform</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="text-xs font-semibold uppercase tracking-wider text-[#D7E2EA] hover:text-white px-4 py-2 rounded-full border border-white/20 hover:border-white/50 bg-white/5 transition flex items-center gap-2"
          >
            <User size={14} className="text-[#D7E2EA]" />
            <span>Customer Login</span>
          </Link>
          <Link
            to="/admin/login"
            className="text-xs font-semibold uppercase tracking-wider text-[#E5A84B] hover:text-white px-4 py-2 rounded-full border border-[#E5A84B]/40 hover:border-[#E5A84B] bg-[#E5A84B]/10 hover:bg-[#E5A84B]/20 transition flex items-center gap-2"
          >
            <ShieldCheck size={14} className="text-[#E5A84B]" />
            <span>Admin Login</span>
          </Link>
        </div>
      </div>
      <div className="mt-8 text-xs text-[#D7E2EA]/40">
        &copy; {new Date().getFullYear()} DineSphere. All rights reserved.
      </div>
    </footer>
  </main>
);

export default Intro;
