import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import type { FloorTable } from './types';

interface SummaryBarProps {
  selectedTables: FloorTable[];
  guests: number;
  onProceed: () => void;
  isHolding: boolean;
  holdExpiresAt: string | null;
  onHoldExpired: () => void;
}

const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const SummaryBar: React.FC<SummaryBarProps> = ({
  selectedTables,
  guests,
  onProceed,
  isHolding,
  holdExpiresAt,
  onHoldExpired
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        clearInterval(interval);
        onHoldExpired();
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, onHoldExpired]);

  const totalSeats = selectedTables.reduce((sum, t) => sum + t.seats, 0);
  const totalFee = selectedTables.reduce((sum, t) => sum + t.fee, 0);
  const tableLabels = selectedTables.map((t) => t.label).join(', ');

  // Validation rules:
  // 1. Must select at least 1 table
  // 2. totalSeats >= guests
  // 3. totalSeats - guests < 4
  const hasSelection = selectedTables.length > 0;
  const isUnderCapacity = hasSelection && totalSeats < guests;
  const isOverCapacity = hasSelection && totalSeats - guests >= 4;
  const isValid = hasSelection && !isUnderCapacity && !isOverCapacity;

  let warningMessage: string | null = null;
  if (!hasSelection) {
    warningMessage = `Please select table(s) on the floor map for ${guests} ${guests === 1 ? 'guest' : 'guests'}.`;
  } else if (isUnderCapacity) {
    warningMessage = `Select more tables for ${guests} guests (currently ${totalSeats} seats selected).`;
  } else if (isOverCapacity) {
    warningMessage = `These tables have ${totalSeats} seats, which is too big for your party of ${guests} (maximum excess is 3 seats).`;
  }

  // Format countdown mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="sticky bottom-4 z-40 max-w-5xl mx-auto px-4 w-full">
      <div className="bg-[#141414]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left info & warnings */}
        <div className="flex-1">
          {hasSelection ? (
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-bold text-white font-mono">
                  Tables: <span className="text-[#E5A84B]">{tableLabels}</span>
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/80">
                  Seats: <strong className="text-white font-mono">{totalSeats}</strong> for{' '}
                  <strong className="text-white font-mono">{guests}</strong> guests
                </span>
                <span className="text-white/30">•</span>
                <span className="font-bold text-white font-mono">
                  Fee: <span className="text-emerald-400">{formatRupees(totalFee)}</span>
                </span>
              </div>

              {warningMessage && (
                <div className="text-xs text-amber-400 flex items-center gap-1.5 mt-1.5 font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{warningMessage}</span>
                </div>
              )}

              {remainingSeconds !== null && remainingSeconds > 0 && (
                <div
                  className={`text-xs mt-1.5 flex items-center gap-1.5 font-mono font-bold ${
                    remainingSeconds < 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  <Clock size={14} />
                  <span>Tables held for {formatCountdown(remainingSeconds)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-white/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E5A84B] animate-ping" />
              <span>Tap available tables on the floor plan above to start booking.</span>
            </div>
          )}
        </div>

        {/* Right Proceed Button with ContactButton styling */}
        <div className="self-stretch sm:self-auto flex justify-end">
          <button
            disabled={!isValid || isHolding}
            onClick={onProceed}
            className="w-full sm:w-auto px-8 py-3 rounded-full text-xs sm:text-sm text-white font-medium uppercase tracking-widest cursor-pointer whitespace-nowrap transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline outline-2 outline-white -outline-offset-[3px]"
            style={{
              background:
                'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
              boxShadow:
                '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset'
            }}
          >
            <span>{isHolding ? 'Holding Tables...' : 'Proceed'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
