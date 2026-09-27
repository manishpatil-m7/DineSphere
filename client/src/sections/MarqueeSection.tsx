import { useRef, useEffect, useState, useCallback } from 'react';

const IMAGES = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return `/assets/marquee/${num}.webp`;
});

const row1 = IMAGES.slice(0, 10);
const row2 = IMAGES.slice(10, 20);

// Triple for seamless loop
const tripled1 = [...row1, ...row1, ...row1];
const tripled2 = [...row2, ...row2, ...row2];

const LABELS = [
  'Plated Gourmet Dish', 'POS Touchscreen', 'Professional Kitchen', 'Dining Room Interior',
  'Kitchen Display Orders', 'Pasta Close-up', 'Analytics Dashboard', 'Chef Plating Food',
  'Cozy Cafe Interior', 'Table Layout Map', 'Burger & Fries', 'Inventory Stock Shelf',
  'Waiter with Tablet', 'Sushi Platter', 'Sales Chart Dashboard', 'Restaurant Bar',
  'Pizza from Oven', 'Waiter Serving', 'Dessert Plate', 'Order Terminal',
];

const MarqueeSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return;
    const sectionTop = sectionRef.current.offsetTop;
    const raw = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
    setOffset(raw);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section
      ref={sectionRef}
      className="bg-[#0C0C0C] pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden w-full max-w-full"
    >
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        {/* Row 1 — moves right */}
        <div className="w-full max-w-full overflow-hidden">
          <div
            className="flex gap-3"
            style={{ transform: `translateX(${offset - 200}px)`, willChange: 'transform' }}
          >
            {tripled1.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={LABELS[i % 10]}
                loading="lazy"
                className="w-[420px] h-[270px] rounded-2xl object-cover shrink-0 bg-[#1a1a1a]"
              />
            ))}
          </div>
        </div>

        {/* Row 2 — moves left */}
        <div className="overflow-hidden">
          <div
            className="flex gap-3"
            style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: 'transform' }}
          >
            {tripled2.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={LABELS[10 + (i % 10)]}
                loading="lazy"
                className="w-[420px] h-[270px] rounded-2xl object-cover shrink-0 bg-[#1a1a1a]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarqueeSection;
