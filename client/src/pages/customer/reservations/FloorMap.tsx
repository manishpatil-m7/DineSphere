import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, Lock, Clock, Sparkles } from 'lucide-react';
import type { FloorTable } from './types';

interface FloorMapProps {
  tables: FloorTable[];
  selectedTableIds: string[];
  onToggleTable: (table: FloorTable) => void;
  loading: boolean;
}

const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const FloorMap: React.FC<FloorMapProps> = ({
  tables,
  selectedTableIds,
  onToggleTable,
  loading
}) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.7, prev - 0.15));
  const handleResetZoom = () => setZoom(1);

  // Ctrl + Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((prev) => Math.min(1.6, prev + 0.1));
        } else {
          setZoom((prev) => Math.max(0.7, prev - 0.1));
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Zones configuration with dynamic rows based on actual tables
  const defaultZones: Array<{
    name: 'Lounge' | 'Window' | 'Family' | 'Regular';
    fee: number;
    defaultRows: string[];
  }> = [
    { name: 'Lounge', fee: 300, defaultRows: ['A', 'B'] },
    { name: 'Window', fee: 200, defaultRows: ['C', 'D'] },
    { name: 'Family', fee: 100, defaultRows: ['E', 'F'] },
    { name: 'Regular', fee: 0, defaultRows: ['G', 'H'] }
  ];

  const zones = defaultZones.map(z => {
    const zoneTables = tables.filter(t => t.zone === z.name);
    let rows = Array.from(new Set(zoneTables.map(t => t.row_label))).sort();
    if (rows.length === 0) {
      rows = z.defaultRows; // fallback to show the empty layout
    }
    return { ...z, rows };
  });

  return (
    <div className="relative bg-[#0d0d0d] border border-white/10 rounded-3xl p-4 sm:p-6 my-6 overflow-hidden shadow-2xl">
      {/* Zoom Controls (Floating Right) */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 bg-black/70 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-xl">
        <button
          onClick={handleZoomIn}
          title="Zoom in (Ctrl + Wheel up)"
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom out (Ctrl + Wheel down)"
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset zoom"
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Reset zoom"
        >
          <RotateCcw size={16} />
        </button>
        <span className="text-[9px] font-mono text-center text-white/50 pt-0.5">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Screen / Curved Kitchen Line */}
      <div className="flex flex-col items-center mb-8 relative">
        <div className="w-full max-w-xl h-4 border-t-2 border-[#E5A84B]/60 rounded-t-[100%] opacity-80 shadow-[0_-8px_20px_rgba(229,168,75,0.2)]" />
        <span className="text-[11px] font-mono tracking-widest text-[#E5A84B]/80 uppercase -mt-1 font-semibold">
          KITCHEN / LIVE CHEF COUNTER
        </span>
      </div>

      {/* Scrollable Floor Map Container */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden pb-6 scrollbar-none touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="min-w-[620px] sm:min-w-[720px] mx-auto transition-transform duration-200 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {loading ? (
            <div className="w-full space-y-8 py-8 animate-pulse">
              {[1, 2, 3, 4].map((z) => (
                <div key={z} className="space-y-3">
                  <div className="h-4 w-40 bg-white/10 mx-auto rounded" />
                  <div className="h-24 bg-white/5 rounded-2xl w-full" />
                </div>
              ))}
            </div>
          ) : (
            zones.map((zoneItem) => {
              return (
                <div key={zoneItem.name} className="w-full mb-8 last:mb-0">
                  {/* Zone Header with Price & Divider */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/15" />
                    <div className="text-center px-4 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-bold tracking-wider uppercase text-[#D7E2EA]">
                      <span>{formatRupees(zoneItem.fee)}</span>
                      <span className="mx-1.5 text-white/30">•</span>
                      <span className="text-[#E5A84B]">{zoneItem.name} Zone</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/15" />
                  </div>

                  {/* Rows inside Zone */}
                  <div className="space-y-3.5">
                    {zoneItem.rows.map((rowLetter) => {
                      const rowTables = tables.filter((t) => t.row_label === rowLetter);
                      const leftBlock = rowTables.filter((t) => t.block === 'left');
                      const centerBlock = rowTables.filter((t) => t.block === 'center');
                      const rightBlock = rowTables.filter((t) => t.block === 'right');

                      return (
                        <div key={rowLetter} className="flex items-center justify-center gap-4 sm:gap-6">
                          {/* Sticky Row Label on Left */}
                          <div className="w-6 text-center font-mono text-sm font-bold text-white/50 select-none">
                            {rowLetter}
                          </div>

                          {/* Left Block */}
                          <div className="flex items-center gap-2.5">
                            {leftBlock.map((table) => renderTableButton(table))}
                          </div>

                          {/* Left Aisle Gap */}
                          <div className="w-6 sm:w-10 border-b border-dashed border-white/10 opacity-30 select-none text-[9px] text-center font-mono">
                            aisle
                          </div>

                          {/* Center Block */}
                          <div className="flex items-center gap-2.5">
                            {centerBlock.map((table) => renderTableButton(table))}
                          </div>

                          {/* Right Aisle Gap */}
                          <div className="w-6 sm:w-10 border-b border-dashed border-white/10 opacity-30 select-none text-[9px] text-center font-mono">
                            aisle
                          </div>

                          {/* Right Block */}
                          <div className="flex items-center gap-2.5">
                            {rightBlock.map((table) => renderTableButton(table))}
                          </div>

                          {/* Symmetric Row Label on Right */}
                          <div className="w-6 text-center font-mono text-sm font-bold text-white/30 select-none">
                            {rowLetter}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  function renderTableButton(table: FloorTable) {
    const isSelected = selectedTableIds.includes(table.id) || table.status === 'yours';
    const isBooked = table.status === 'booked';
    const isHeld = table.status === 'held';
    const isClickable = !isBooked && !isHeld;

    // Capacity width hinting:
    // 2-seater: 36px, 4-seater: 48px, 6-seater: 62px, height 34px
    const widthClass =
      table.seats === 2
        ? 'w-[36px]'
        : table.seats === 4
        ? 'w-[48px]'
        : 'w-[62px]';

    return (
      <div key={table.id} className="relative group">
        <button
          type="button"
          disabled={!isClickable}
          onClick={() => isClickable && onToggleTable(table)}
          aria-label={`Table ${table.label}, ${table.seats} seats, ${formatRupees(table.fee)}, ${table.status}`}
          aria-pressed={isSelected}
          className={`
            h-[34px] ${widthClass} rounded-xl text-xs font-bold font-mono transition-all duration-200
            flex items-center justify-center relative cursor-pointer outline-none focus:ring-2 focus:ring-[#B600A8]
            ${
              isSelected
                ? 'text-white scale-105 shadow-lg shadow-[#B600A8]/40 ring-1 ring-white/40'
                : isBooked
                ? 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
                : isHeld
                ? 'border-2 border-dashed border-amber-400 bg-amber-500/10 text-amber-300 cursor-not-allowed'
                : 'bg-transparent border-2 border-emerald-500/80 text-emerald-400 hover:bg-emerald-500/15 hover:scale-105'
            }
          `}
          style={
            isSelected
              ? {
                  background:
                    'linear-gradient(135deg, #18011F 0%, #B600A8 40%, #7621B0 75%, #BE4C00 100%)'
                }
              : undefined
          }
        >
          {isSelected ? (
            <Check size={14} className="stroke-[3]" />
          ) : isBooked ? (
            <Lock size={12} className="opacity-40" />
          ) : isHeld ? (
            <Clock size={12} className="animate-spin-slow" />
          ) : (
            <span>{table.col_index}</span>
          )}

          {/* Seat indicator badge on top edge */}
          <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[8px] rounded-full bg-black/80 border border-white/20 text-white/70 font-mono">
            {table.seats}p
          </span>
        </button>

        {/* Rich Tooltip on Hover/Focus */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-40 bg-[#1c1c1c] border border-white/20 px-2.5 py-1.5 rounded-xl shadow-2xl pointer-events-none text-center whitespace-nowrap">
          <p className="font-mono text-xs font-bold text-white">
            Table {table.label}
          </p>
          <p className="text-[10px] text-white/70 mt-0.5">
            {table.seats} seats • {formatRupees(table.fee)}
          </p>
          <p
            className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
              isSelected
                ? 'text-fuchsia-400'
                : isBooked
                ? 'text-neutral-500'
                : isHeld
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {isSelected ? 'Selected by you' : table.status}
          </p>
        </div>
      </div>
    );
  }
};
