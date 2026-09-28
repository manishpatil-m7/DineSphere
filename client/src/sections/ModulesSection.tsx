import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import LiveDemoButton from '../components/LiveDemoButton';

interface ModuleData {
  num: string;
  category: string;
  name: string;
  images: { col1Top: string; col1Bottom: string; col2: string };
}

const MODULES: ModuleData[] = [
  {
    num: '01',
    category: 'Front of House',
    name: 'DineSphere POS',
    images: {
      col1Top: '/assets/modules/pos-1.webp',
      col1Bottom: '/assets/modules/pos-2.webp',
      col2: '/assets/modules/pos-3.webp',
    },
  },
  {
    num: '02',
    category: 'Back of House',
    name: 'Kitchen Display System',
    images: {
      col1Top: '/assets/modules/kds-1.webp',
      col1Bottom: '/assets/modules/kds-2.webp',
      col2: '/assets/modules/kds-3.webp',
    },
  },
  {
    num: '03',
    category: 'Analytics',
    name: 'Insights Dashboard',
    images: {
      col1Top: '/assets/modules/insights-1.webp',
      col1Bottom: '/assets/modules/insights-2.webp',
      col2: '/assets/modules/insights-3.webp',
    },
  },
];

const TOTAL = MODULES.length;

const ModuleCard = ({ module, index }: { module: ModuleData; index: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const targetScale = 1 - (TOTAL - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div ref={containerRef} className="h-[85vh]" style={{ position: 'relative' }}>
      <motion.div
        style={{
          scale,
          top: `calc(10vh + ${index * 28}px)`,
        }}
        className="
          sticky
          w-full
          h-[75vh] sm:h-[80vh]
          flex flex-col
          rounded-[40px] sm:rounded-[50px] md:rounded-[60px]
          border-2 border-[#D7E2EA]
          bg-[#0C0C0C]
          p-4 sm:p-6 md:p-8
          overflow-hidden
          origin-top
        "
      >
        {/* ── Top row: number, category, name, button ── */}
        <div className="flex items-start justify-between gap-4 sm:gap-6 mb-4 sm:mb-6 min-w-0">
          {/* Left: number + text block */}
          <div className="flex items-start gap-4 sm:gap-6 min-w-0">
            <span
              className="hero-heading font-black leading-none shrink-0"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 120px)' }}
            >
              {module.num}
            </span>
            <div className="flex flex-col justify-center pt-1 sm:pt-3 min-w-0">
              <span className="text-[#D7E2EA] opacity-60 text-xs sm:text-sm uppercase tracking-widest block">
                {module.category}
              </span>
              <h3
                className="text-[#D7E2EA] font-medium uppercase truncate"
                style={{ fontSize: 'clamp(0.9rem, 2vw, 2rem)' }}
              >
                {module.name}
              </h3>
            </div>
          </div>

          {/* Right: Live Demo button */}
          <div className="self-center shrink-0">
            <LiveDemoButton />
          </div>
        </div>

        {/* ── Image grid ── */}
        <div className="flex gap-3 sm:gap-4 flex-1 min-h-0">
          {/* Left column (40%) — 2 stacked */}
          <div className="w-[40%] flex flex-col gap-3 sm:gap-4">
            <img
              src={module.images.col1Top}
              alt={`${module.name} view 1`}
              className="w-full flex-[2] min-h-0 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] object-cover bg-[#1a1a1a]"
            />
            <img
              src={module.images.col1Bottom}
              alt={`${module.name} view 2`}
              className="w-full flex-[3] min-h-0 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] object-cover bg-[#1a1a1a]"
            />
          </div>

          {/* Right column (60%) — 1 tall */}
          <div className="w-[60%] h-full">
            <img
              src={module.images.col2}
              alt={`${module.name} view 3`}
              className="w-full h-full rounded-[24px] sm:rounded-[32px] md:rounded-[40px] object-cover bg-[#1a1a1a]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ModulesSection = () => (
  <section
    id="modules"
    className="
      bg-[#0C0C0C]
      rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]
      -mt-10 sm:-mt-12 md:-mt-14
      relative z-10
      py-20 sm:py-24 md:py-32
    "
  >
    {/* Heading */}
    <div className="px-5 sm:px-8 md:px-10">
      <h2
        className="hero-heading font-black uppercase text-center mb-16 sm:mb-20 md:mb-28"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Modules
      </h2>
    </div>

    {/* Cards — full-width centered wrapper with consistent padding */}
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
      {MODULES.map((module, i) => (
        <ModuleCard key={module.num} module={module} index={i} />
      ))}
    </div>
  </section>
);

export default ModulesSection;
