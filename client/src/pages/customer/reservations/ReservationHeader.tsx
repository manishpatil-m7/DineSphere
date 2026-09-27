import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReservationHeaderProps {
  date: string;
  slot: string;
  guests: number;
  onGuestsChange: (guests: number) => void;
  onBack?: () => void;
}

export const ReservationHeader: React.FC<ReservationHeaderProps> = ({
  date,
  slot,
  guests,
  onGuestsChange,
  onBack
}) => {
  const [showGuestStepper, setShowGuestStepper] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowGuestStepper(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-4">
      {/* Left: Back Arrow + Title */}
      <div className="flex items-center gap-3.5">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            Reserve a Table
          </h1>
          <p className="text-xs text-white/50 tracking-wider">
            DineSphere Fine Dining • <span className="text-[#E5A84B] font-medium">{formattedDate}</span> • <span className="text-[#E5A84B] font-mono font-medium">{slot}</span>
          </p>
        </div>
      </div>

      {/* Right: "{n} Guests" pill button (like cinema "2 Tickets") */}
      <div className="relative self-end sm:self-auto" ref={popupRef}>
        <button
          onClick={() => setShowGuestStepper(!showGuestStepper)}
          className="px-4 py-2 rounded-full border border-[#D7E2EA]/30 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Users size={15} className="text-[#E5A84B]" />
          <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
        </button>

        {showGuestStepper && (
          <div className="absolute right-0 mt-2 w-56 bg-[#161616] border border-white/15 rounded-2xl p-4 shadow-2xl z-40 animate-scaleUp">
            <div className="text-center mb-3">
              <span className="text-xs text-white/60 block uppercase tracking-wider font-semibold">Party Size</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {guests} <span className="text-xs font-normal text-white/50">people</span>
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-1.5">
              <button
                disabled={guests <= 1}
                onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white disabled:opacity-30 transition"
              >
                <Minus size={14} />
              </button>

              <span className="font-mono text-sm font-bold text-[#E5A84B]">
                {guests}
              </span>

              <button
                disabled={guests >= 12}
                onClick={() => onGuestsChange(Math.min(12, guests + 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white disabled:opacity-30 transition"
              >
                <Plus size={14} />
              </button>
            </div>

            <p className="text-[10px] text-white/40 text-center mt-2.5">
              Capacity: 1 to 12 guests per booking
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
