import React from 'react';
import { Check, Lock, Clock, Sparkles } from 'lucide-react';

export const Legend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-3 px-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/70">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border-2 border-emerald-500 bg-transparent flex items-center justify-center text-emerald-400">
          <Sparkles size={11} />
        </div>
        <span>Available</span>
      </div>

      {/* Selected */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #18011F 0%, #B600A8 40%, #7621B0 75%, #BE4C00 100%)'
          }}
        >
          <Check size={12} />
        </div>
        <span className="text-white font-medium">Selected</span>
      </div>

      {/* Booked */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-white/15 border border-white/10 flex items-center justify-center text-white/40">
          <Lock size={11} />
        </div>
        <span>Booked</span>
      </div>

      {/* Held by someone else */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border-2 border-dashed border-amber-400 bg-amber-500/10 flex items-center justify-center text-amber-400">
          <Clock size={11} />
        </div>
        <span>Held (5m)</span>
      </div>
    </div>
  );
};
