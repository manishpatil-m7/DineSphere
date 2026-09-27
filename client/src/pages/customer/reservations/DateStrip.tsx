import React from 'react';

interface DateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  maxDays?: number;
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onSelectDate, maxDays = 14 }) => {
  // Generate next maxDays
  const days = Array.from({ length: maxDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    return { dateStr, weekday, dayNum, month, isToday: i === 0 };
  });

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
      {days.map((item) => {
        const isSelected = selectedDate === item.dateStr;
        return (
          <button
            key={item.dateStr}
            onClick={() => onSelectDate(item.dateStr)}
            className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] py-2.5 px-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-transparent text-white font-bold scale-105 shadow-lg shadow-[#B600A8]/30'
                : 'bg-white/[0.03] border-white/10 text-white/70 hover:border-white/30 hover:bg-white/5'
            }`}
            style={
              isSelected
                ? {
                    background:
                      'linear-gradient(135deg, #18011F 0%, #B600A8 40%, #7621B0 75%, #BE4C00 100%)',
                    boxShadow: '0 4px 14px rgba(182, 0, 168, 0.4)'
                  }
                : undefined
            }
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold opacity-80">
              {item.isToday ? 'Today' : item.weekday}
            </span>
            <span className="text-base sm:text-lg font-mono font-bold mt-0.5">
              {item.dayNum}
            </span>
            <span className="text-[9px] uppercase tracking-widest opacity-60">
              {item.month}
            </span>
          </button>
        );
      })}
    </div>
  );
};
