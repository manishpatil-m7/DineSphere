import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
}

// Wraps by word so text can break across lines, but per-character opacity still works
const AnimatedText = ({ text, className = '' }: AnimatedTextProps) => {
  const containerRef = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  // Flatten to characters with their global index for opacity calculation
  const words = text.split(' ');
  const totalChars = text.replace(/ /g, '').length;
  let charIndex = 0;

  return (
    <p ref={containerRef} className={`${className}`}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split('').map((char) => {
            const globalIndex = charIndex++;
            return (
              <CharSpan
                key={globalIndex}
                char={char}
                index={globalIndex}
                total={totalChars}
                progress={scrollYProgress}
              />
            );
          })}
          {/* Space after each word (except last) */}
          {wi < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </p>
  );
};

interface CharSpanProps {
  char: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}

const CharSpan = ({ char, index, total, progress }: CharSpanProps) => {
  const start = index / total;
  const end = Math.min(start + 2 / total, 1);
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="inline">
      {char}
    </motion.span>
  );
};

export default AnimatedText;
