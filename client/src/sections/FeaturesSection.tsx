import FadeIn from '../components/FadeIn';

const FEATURES = [
  {
    num: '01',
    name: 'Orders & POS',
    desc: 'Fast, intuitive point of sale for dine-in, takeaway and delivery, with split bills, discounts and instant receipts.',
  },
  {
    num: '02',
    name: 'Tables & Reservations',
    desc: 'Live table map and booking management that keeps seating organized, reduces wait times and prevents double bookings.',
  },
  {
    num: '03',
    name: 'Kitchen Display',
    desc: 'Orders reach the kitchen in real time, sorted by priority and prep time, so every dish leaves the pass on schedule.',
  },
  {
    num: '04',
    name: 'Inventory',
    desc: 'Track ingredients and stock levels automatically, get low-stock alerts, and cut waste with usage-based reordering.',
  },
  {
    num: '05',
    name: 'Analytics',
    desc: 'Clear dashboards for sales, best-selling dishes, staff performance and peak hours to guide smarter daily decisions.',
  },
];

const FeaturesSection = () => (
  <section
    id="features"
    className="
      bg-[#FFFFFF] text-[#0C0C0C]
      rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]
      px-5 sm:px-8 md:px-10
      py-20 sm:py-24 md:py-32
    "
  >
    {/* Heading */}
    <h2
      className="
        text-[#0C0C0C] font-black uppercase text-center
        mb-16 sm:mb-20 md:mb-28
      "
      style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
    >
      Features
    </h2>

    {/* Feature list */}
    <div className="max-w-5xl mx-auto">
      {FEATURES.map((f, i) => (
        <FadeIn key={f.num} delay={i * 0.1} y={30}>
          <div
            className="flex items-start gap-4 sm:gap-8 md:gap-12 py-8 sm:py-10 md:py-12"
            style={{
              borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(12,12,12,0.15)' : 'none',
              borderTop: i === 0 ? '1px solid rgba(12,12,12,0.15)' : 'none',
            }}
          >
            {/* Number */}
            <span
              className="font-black text-[#0C0C0C] shrink-0 leading-none"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 120px)' }}
            >
              {f.num}
            </span>

            {/* Name + description */}
            <div className="flex flex-col justify-center pt-1 sm:pt-3 min-w-0">
              <h3
                className="font-medium uppercase text-[#0C0C0C] mb-1"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
              >
                {f.name}
              </h3>
              <p
                className="font-light leading-relaxed text-[#0C0C0C] opacity-60"
                style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}
              >
                {f.desc}
              </p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
