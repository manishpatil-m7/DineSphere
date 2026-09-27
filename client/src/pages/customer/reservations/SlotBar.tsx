import type { SlotInfo } from './types';

interface SlotBarProps {
  slots: SlotInfo[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  loading: boolean;
}

const statusColorClasses: Record<string, { border: string; tooltip: string }> = {
  available: { border: 'border-l-emerald-500', tooltip: 'Available (>50% free)' },
  fast_filling: { border: 'border-l-amber-400', tooltip: 'Fast Filling (20-50% free)' },
  almost_full: { border: 'border-l-rose-500', tooltip: 'Almost Full (<20% free)' },
  sold_out: { border: 'border-l-neutral-600', tooltip: 'Sold Out' },
  past: { border: 'border-l-neutral-800', tooltip: 'Past Time Slot' }
};

export const SlotBar: React.FC<SlotBarProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  loading
}) => {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3 sm:p-4 my-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs uppercase tracking-widest text-white/50 font-semibold">
          Select Dining Showtime
        </span>
        <span className="text-[11px] text-white/40 hidden sm:inline">
          Colored edge indicates live table availability
        </span>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="w-24 h-14 bg-white/5 rounded-xl animate-pulse shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {slots.map((s) => {
            const isSelected = selectedSlot === s.slot;
            const isDisabled = s.status === 'sold_out' || s.status === 'past';
            const meta = statusColorClasses[s.status] || statusColorClasses.available;

            return (
              <div key={s.slot} className="relative group shrink-0">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectSlot(s.slot)}
                  className={`min-w-[88px] sm:min-w-[96px] py-2 px-3 rounded-xl border border-white/10 border-l-[4px] ${meta.border} text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#E5A84B] text-black font-bold border-[#E5A84B] shadow-md shadow-[#E5A84B]/25'
                      : isDisabled
                      ? 'bg-white/[0.01] text-white/25 cursor-not-allowed opacity-40'
                      : 'bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="font-mono text-sm font-bold tracking-tight">
                    {s.slot}
                  </div>
                  <div className="text-[10px] tracking-wide mt-0.5 opacity-80">
                    {s.status === 'past'
                      ? 'Passed'
                      : s.status === 'sold_out'
                      ? 'Full'
                      : `${s.free_tables} free`}
                  </div>
                </button>

                {/* Hover Tooltip explaining status */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-[#1e1e1e] border border-white/15 px-2.5 py-1 rounded-lg text-[10px] text-white whitespace-nowrap shadow-xl pointer-events-none">
                  {meta.tooltip}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
