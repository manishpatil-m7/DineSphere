import { motion } from 'framer-motion';
import FadeIn from '../components/FadeIn';
import AnimatedText from '../components/AnimatedText';
import ContactButton from '../components/ContactButton';

const CORNER_IMAGES = [
  {
    src: '/assets/about/plate.png',
    alt: 'Decorative 3D plate with food',
    position: 'top-[4%] left-[1%] sm:left-[2%] md:left-[4%]',
    size: 'w-[90px] sm:w-[140px] md:w-[200px]',
    fadeIn: { delay: 0.1, x: -80, y: 0, duration: 0.9 },
    floatDelay: 0,
  },
  {
    src: '/assets/about/menu.png',
    alt: 'Decorative menu card',
    position: 'bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]',
    size: 'w-[80px] sm:w-[120px] md:w-[170px]',
    fadeIn: { delay: 0.25, x: -80, y: 0, duration: 0.9 },
    floatDelay: 1.2,
  },
  {
    src: '/assets/about/chef-hat.png',
    alt: 'Decorative chef hat',
    position: 'top-[4%] right-[1%] sm:right-[2%] md:right-[4%]',
    size: 'w-[90px] sm:w-[140px] md:w-[200px]',
    fadeIn: { delay: 0.15, x: 80, y: 0, duration: 0.9 },
    floatDelay: 0.6,
  },
  {
    src: '/assets/about/pos.png',
    alt: 'Decorative POS terminal',
    position: 'bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]',
    size: 'w-[100px] sm:w-[130px] md:w-[210px]',
    fadeIn: { delay: 0.3, x: 80, y: 0, duration: 0.9 },
    floatDelay: 1.8,
  },
];

const ABOUT_TEXT =
  "Running a restaurant is hard enough. DineSphere brings orders, tables, kitchen, billing and inventory into one connected platform, so your team spends less time juggling tools and more time serving guests. Let's build a smoother service together!";

const AboutSection = () => (
  <section
    id="about"
    className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 md:px-10 py-20 bg-[#0C0C0C]"
  >
    {/* Corner images */}
    {CORNER_IMAGES.map((img) => (
      <FadeIn
        key={img.src}
        delay={img.fadeIn.delay}
        x={img.fadeIn.x}
        y={img.fadeIn.y}
        duration={img.fadeIn.duration}
        className={`absolute ${img.position} ${img.size} pointer-events-none hidden sm:block`}
      >
        <motion.img
          src={img.src}
          alt={img.alt}
          className="w-full h-auto object-contain"
          draggable={false}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: img.floatDelay,
          }}
        />
      </FadeIn>
    ))}

    {/* Center content */}
    <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16 w-full">
      {/* Heading */}
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading font-black uppercase leading-none tracking-tight text-center"
          style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
        >
          About us
        </h2>
      </FadeIn>

      {/* Animated paragraph — word-wrapped, centered, capped width */}
      <AnimatedText
        text={ABOUT_TEXT}
        className="
          text-[#D7E2EA] font-medium text-center leading-relaxed
          mx-auto max-w-[560px] px-5 w-full
        "
      />

      {/* Gap before button */}
      <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <FadeIn delay={0.4} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </div>
  </section>
);

export default AboutSection;
