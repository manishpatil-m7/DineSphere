import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import ContactButton from '../components/ContactButton';
import ChefHero from '../components/ChefHero';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Contact', href: '#contact' },
];

const HeroSection: React.FC = () => {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen min-h-[100svh] w-full max-w-full flex flex-col justify-between overflow-hidden bg-[#0C0C0C]">
      {/* ── Top Bar: Navigation & Login Options ── */}
      <FadeIn delay={0} y={-20} className="w-full z-20">
        <div className="w-full px-6 md:px-10 pt-4 md:pt-6">
          {/* Customer and Admin Login Options */}
          <div className="w-full flex justify-end items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <Link
              to="/login"
              className="
                text-xs sm:text-sm font-semibold uppercase tracking-wider
                text-[#D7E2EA] hover:text-white
                px-3.5 sm:px-4 py-1.5 rounded-full border border-white/20 hover:border-white/60
                bg-white/[0.04] hover:bg-white/10 transition-all duration-200
                flex items-center gap-1.5 shadow-sm
              "
            >
              <User size={14} className="text-[#D7E2EA]" />
              <span>Customer Login</span>
            </Link>
            <Link
              to="/admin/login"
              className="
                text-xs sm:text-sm font-semibold uppercase tracking-wider
                text-[#E5A84B] hover:text-white
                px-3.5 sm:px-4 py-1.5 rounded-full border border-[#E5A84B]/40 hover:border-[#E5A84B]
                bg-[#E5A84B]/10 hover:bg-[#E5A84B]/25 transition-all duration-200
                flex items-center gap-1.5 shadow-sm
              "
            >
              <ShieldCheck size={14} className="text-[#E5A84B]" />
              <span>Admin Login</span>
            </Link>
          </div>

          <nav className="w-full flex justify-between items-center">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="
                  text-[#D7E2EA] font-medium uppercase tracking-wider
                  text-sm md:text-lg lg:text-[1.35rem]
                  hover:opacity-70 transition-opacity duration-200
                  cursor-pointer bg-transparent border-none p-0
                "
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </FadeIn>

      {/* ── Center Content / Heading ── */}
      <div className="w-full px-4 md:px-6 mt-4 sm:mt-2 md:-mt-4 z-10 text-center flex flex-col items-center">
        <FadeIn delay={0.15} y={40} className="w-full overflow-hidden flex justify-center">
          <h1
            className="
              hero-heading font-black uppercase tracking-tight leading-none
              whitespace-nowrap text-center select-none
              text-[12.8vw] sm:text-[13.8vw] md:text-[14.5vw] lg:text-[14.8vw]
            "
          >
            DineSphere
          </h1>
        </FadeIn>
      </div>

      {/* ── Chef Hero Visual with Cursor Eye-Tracking ── */}
      <div
        className="
          absolute bottom-0 left-1/2 -translate-x-1/2 z-10
          pointer-events-none
          h-[34vh] sm:h-[min(44vh,440px)]
          aspect-[400/440] w-auto
          flex items-end justify-center
        "
      >
        <FadeIn delay={0.6} y={30} className="w-full h-full flex items-end justify-center">
          <ChefHero />
        </FadeIn>
      </div>

      {/* ── Bottom bar (sits at very bottom of screen) ── */}
      <div className="w-full flex justify-between items-end px-6 md:px-10 pb-7 sm:pb-8 md:pb-10 z-20">
        <FadeIn delay={0.35} y={20}>
          <p
            className="
              text-[#D7E2EA] font-light uppercase tracking-wide leading-snug
              max-w-[190px] sm:max-w-[260px] md:max-w-[320px]
            "
            style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1.4rem)' }}
          >
            a restaurant management system that runs orders, kitchen and
            inventory in one place
          </p>
        </FadeIn>

        <FadeIn delay={0.5} y={20} className="flex-shrink-0">
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
};

export default HeroSection;
