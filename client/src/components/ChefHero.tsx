import React, { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// ChefHero — Clean, Flat Vector Chef Mascot
// Features:
// - Flat solid colors, no gradients, no glossy highlights
// - Eyes follow mouse cursor everywhere on the window
// - Direct SVG attribute transforms for smooth 60fps tracking
// - Periodic natural blink
// ─────────────────────────────────────────────────────────────

const ChefHero: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);
  const leftPupilRef = useRef<SVGGElement>(null);
  const rightPupilRef = useRef<SVGGElement>(null);
  const leftEyeGroupRef = useRef<SVGGElement>(null);
  const rightEyeGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      // Left eye tracking
      if (leftEyeRef.current && leftPupilRef.current) {
        const rect = leftEyeRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        const maxTravel = 11; // SVG units (24 radius - 11 pupil - 2 margin)
        const move = Math.min(dist / 200, 1) * maxTravel;
        const tx = Math.cos(angle) * move;
        const ty = Math.sin(angle) * move;
        leftPupilRef.current.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
      }

      // Right eye tracking
      if (rightEyeRef.current && rightPupilRef.current) {
        const rect = rightEyeRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        const maxTravel = 11;
        const move = Math.min(dist / 200, 1) * maxTravel;
        const tx = Math.cos(angle) * move;
        const ty = Math.sin(angle) * move;
        rightPupilRef.current.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Periodic natural eye blink every 3 to 5 seconds
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const triggerBlink = () => {
      if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
        leftEyeGroupRef.current.style.transform = 'scaleY(0.1)';
        rightEyeGroupRef.current.style.transform = 'scaleY(0.1)';

        setTimeout(() => {
          if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
            leftEyeGroupRef.current.style.transform = 'scaleY(1)';
            rightEyeGroupRef.current.style.transform = 'scaleY(1)';
          }
        }, 120);
      }
      const nextDelay = 3000 + Math.random() * 2000;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 3500);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      clearTimeout(blinkTimeout);
    };
  }, []);

  return (
    <svg
      id="chef-svg"
      ref={svgRef}
      viewBox="0 0 400 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none"
      aria-label="DineSphere Chef Mascot"
    >
      {/* ── Soft flat circle backdrop (25% purple) ── */}
      <circle cx="200" cy="250" r="135" fill="#7621B0" fillOpacity="0.25" />

      {/* ── Coat / Body ── */}
      <path
        d="M 65 440 L 85 345 Q 95 305 140 300 L 260 300 Q 305 305 315 345 L 335 440 Z"
        fill="#F5F7FA"
      />
      {/* Center coat line */}
      <line x1="200" y1="330" x2="200" y2="440" stroke="#D7E2EA" strokeWidth="2" strokeLinecap="round" />

      {/* Collar in #D7E2EA */}
      <path d="M 160 300 L 200 332 L 176 332 Z" fill="#D7E2EA" />
      <path d="M 240 300 L 200 332 L 224 332 Z" fill="#D7E2EA" />

      {/* Neckerchief (small magenta triangle at collar) */}
      <polygon points="190,314 210,314 200,332" fill="#B600A8" />

      {/* Buttons: 2 columns x 2 rows (r 6, #BBCCD7) */}
      <circle cx="176" cy="362" r="6" fill="#BBCCD7" />
      <circle cx="224" cy="362" r="6" fill="#BBCCD7" />
      <circle cx="176" cy="402" r="6" fill="#BBCCD7" />
      <circle cx="224" cy="402" r="6" fill="#BBCCD7" />

      {/* ── Neck ── */}
      <rect x="185" y="260" width="30" height="44" rx="4" fill="#F1C9A5" />

      {/* ── Ears (behind head) ── */}
      <circle cx="130" cy="215" r="14" fill="#F1C9A5" />
      <circle cx="270" cy="215" r="14" fill="#F1C9A5" />

      {/* ── Head / Face (skin circle, no outline) ── */}
      <circle cx="200" cy="215" r="66" fill="#F1C9A5" />

      {/* ── Cheek blush circles (40% opacity) ── */}
      <circle cx="156" cy="235" r="12" fill="#F4A6A0" fillOpacity="0.4" />
      <circle cx="244" cy="235" r="12" fill="#F4A6A0" fillOpacity="0.4" />

      {/* ── Nose ── */}
      <circle cx="200" cy="226" r="6.5" fill="#E2AE86" />

      {/* ── Mouth (simple dark smile arc) ── */}
      <path
        d="M 186 248 Q 200 264 214 248"
        stroke="#2B2B2B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Eyebrows (two short thick dark rounded lines) ── */}
      <path
        d="M 150 178 Q 165 171 180 177"
        stroke="#2B2B2B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 220 177 Q 235 171 250 178"
        stroke="#2B2B2B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Left Eye ── */}
      <g
        id="eye-left"
        ref={leftEyeGroupRef}
        style={{ transformOrigin: '165px 205px', transition: 'transform 0.08s ease' }}
      >
        <circle
          ref={leftEyeRef}
          cx="165"
          cy="205"
          r="24"
          fill="#FFFFFF"
          stroke="#2B2B2B"
          strokeWidth="2"
        />
        <g id="pupil-left" ref={leftPupilRef}>
          <circle cx="165" cy="205" r="11" fill="#2B2B2B" />
          <circle cx="162" cy="202" r="3.5" fill="#FFFFFF" />
        </g>
      </g>

      {/* ── Right Eye ── */}
      <g
        id="eye-right"
        ref={rightEyeGroupRef}
        style={{ transformOrigin: '235px 205px', transition: 'transform 0.08s ease' }}
      >
        <circle
          ref={rightEyeRef}
          cx="235"
          cy="205"
          r="24"
          fill="#FFFFFF"
          stroke="#2B2B2B"
          strokeWidth="2"
        />
        <g id="pupil-right" ref={rightPupilRef}>
          <circle cx="235" cy="205" r="11" fill="#2B2B2B" />
          <circle cx="232" cy="202" r="3.5" fill="#FFFFFF" />
        </g>
      </g>

      {/* ── Chef Hat (Toque) ── */}
      {/* 3 overlapping circles with thin #D7E2EA outline */}
      <g id="hat-toque">
        <circle cx="152" cy="110" r="42" fill="#FFFFFF" stroke="#D7E2EA" strokeWidth="2" />
        <circle cx="248" cy="110" r="42" fill="#FFFFFF" stroke="#D7E2EA" strokeWidth="2" />
        <circle cx="200" cy="88" r="50" fill="#FFFFFF" stroke="#D7E2EA" strokeWidth="2" />
        {/* Interior fill to merge the 3 puffs cleanly without inner stroke lines */}
        <circle cx="152" cy="110" r="40" fill="#FFFFFF" />
        <circle cx="248" cy="110" r="40" fill="#FFFFFF" />
        <circle cx="200" cy="88" r="48" fill="#FFFFFF" />
        <rect x="130" y="100" width="140" height="42" fill="#FFFFFF" />

        {/* Rounded rectangle band */}
        <rect
          x="126"
          y="136"
          width="148"
          height="26"
          rx="5"
          fill="#FFFFFF"
          stroke="#D7E2EA"
          strokeWidth="2"
        />
        {/* Light gray (#E4E9EE) band strip at the bottom of the hat */}
        <rect x="127" y="154" width="146" height="7" rx="2" fill="#E4E9EE" />
      </g>
    </svg>
  );
};

export default ChefHero;
