import React from 'react';
import { CheckCircle2, Calendar, Download, Eye, RotateCcw, MapPin, Users, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { CinemaReservation } from './types';

interface SuccessScreenProps {
  reservation: CinemaReservation;
  onViewReservations: () => void;
  onBookAnother: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  reservation,
  onViewReservations,
  onBookAnother
}) => {
  const tableLabels = reservation.tables.map((t) => t.table_label).join(', ');

  // Download .ics Calendar File
  const handleDownloadCalendar = () => {
    const [y, m, d] = reservation.date.split('-').map(Number);
    const [h, min] = reservation.time_slot.split(':').map(Number);

    const startDate = new Date(y, m - 1, d, h, min);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const formatIcsTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DineSphere Restaurant//Table Reservation//EN',
      'BEGIN:VEVENT',
      `UID:${reservation.code}@dinesphere.com`,
      `DTSTAMP:${formatIcsTime(new Date())}`,
      `DTSTART:${formatIcsTime(startDate)}`,
      `DTEND:${formatIcsTime(endDate)}`,
      `SUMMARY:Dinner at DineSphere (Table ${tableLabels})`,
      `DESCRIPTION:Reservation Code: ${reservation.code}\\nParty of: ${reservation.guests} guests\\nTable(s): ${tableLabels}`,
      'LOCATION:DineSphere Restaurant, Marine Drive, Mumbai',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `DineSphere-Reservation-${reservation.code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-center animate-fadeIn">
      {/* Animated Check */}
      <div className="w-18 h-18 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-bounce">
        <CheckCircle2 size={40} />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
        Table Reserved Successfully!
      </h2>
      <p className="text-xs sm:text-sm text-white/60 mt-1">
        We look forward to welcoming you to DineSphere.
      </p>

      {/* Reservation Code & QR Card */}
      <div className="bg-[#141414] border border-white/15 rounded-3xl p-6 sm:p-8 mt-6 text-center shadow-2xl relative overflow-hidden">
        <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-4">
          <QRCodeSVG value={reservation.code} size={150} />
        </div>

        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 block">Booking Reference</span>
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#E5A84B] tracking-wider mt-0.5 block">
            {reservation.code}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/10 text-xs">
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[10px] text-white/40 block">Date</span>
            <strong className="text-white font-mono">{reservation.date}</strong>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[10px] text-white/40 block">Time Slot</span>
            <strong className="text-white font-mono">{reservation.time_slot}</strong>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[10px] text-white/40 block">Table(s)</span>
            <strong className="text-[#E5A84B] font-mono">{tableLabels}</strong>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[10px] text-white/40 block">Guests</span>
            <strong className="text-white">{reservation.guests} Guests</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <button
          onClick={handleDownloadCalendar}
          className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download size={14} />
          <span>Add to Calendar (.ics)</span>
        </button>

        <button
          onClick={onViewReservations}
          className="px-6 py-2.5 rounded-full border border-[#D7E2EA] bg-[#D7E2EA]/10 hover:bg-[#D7E2EA]/20 text-[#D7E2EA] text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Eye size={14} />
          <span>View My Reservations</span>
        </button>

        <button
          onClick={onBookAnother}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background:
              'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)'
          }}
        >
          <RotateCcw size={14} />
          <span>Book Another</span>
        </button>
      </div>
    </div>
  );
};
