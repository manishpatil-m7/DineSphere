import React, { useState } from 'react';
import { X, QrCode, CreditCard, Banknote, Calendar, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { FloorTable } from './types';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdId: string;
  selectedTables: FloorTable[];
  date: string;
  slot: string;
  guests: number;
  onConfirm: (payload: {
    hold_id: string;
    guests: number;
    occasion?: string;
    special_request?: string;
    payment_method: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  holdId,
  selectedTables,
  date,
  slot,
  guests,
  onConfirm,
  isSubmitting
}) => {
  const [occasion, setOccasion] = useState('None');
  const [specialRequest, setSpecialRequest] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');

  // Client-only card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!isOpen) return null;

  const totalFee = selectedTables.reduce((sum, t) => sum + t.fee, 0);
  const tableLabels = selectedTables.map((t) => t.label).join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'Card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid 16-digit card number (mock).');
        return;
      }
    }

    await onConfirm({
      hold_id: holdId,
      guests,
      occasion: occasion !== 'None' ? occasion : undefined,
      special_request: specialRequest.trim() || undefined,
      payment_method: paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div
        className="w-full max-w-lg bg-[#141414] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideUp sm:animate-scaleUp text-[#D7E2EA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-widest text-[#E5A84B] font-bold">
            Checkout & Confirmation
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Confirm Table Reservation</h2>
        </div>

        {/* Summary Details Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-white/80">
            <span className="flex items-center gap-2 text-white/60">
              <Calendar size={14} className="text-[#E5A84B]" /> Date & Time
            </span>
            <span className="font-bold text-white font-mono">{date} • {slot}</span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="flex items-center gap-2 text-white/60">
              <Sparkles size={14} className="text-[#E5A84B]" /> Tables Selected
            </span>
            <span className="font-bold text-[#E5A84B] font-mono">
              Table {tableLabels} ({selectedTables.reduce((s, t) => s + t.seats, 0)} Seats)
            </span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="flex items-center gap-2 text-white/60">
              <Users size={14} className="text-[#E5A84B]" /> Party Size
            </span>
            <span className="font-bold text-white">{guests} Guests</span>
          </div>

          <div className="border-t border-white/10 pt-2 flex justify-between items-center font-bold">
            <span>Reservation / Table Fee</span>
            <span className="text-emerald-400 font-mono text-base">{formatRupees(totalFee)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Occasion Select */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/60 block mb-1.5 font-semibold">
              Special Occasion
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
            >
              <option value="None">None (Standard Dining)</option>
              <option value="Birthday">Birthday Celebration 🎂</option>
              <option value="Anniversary">Romantic Anniversary 🥂</option>
              <option value="Business">Business Meeting / Dinner 💼</option>
              <option value="Date night">Date Night ❤️</option>
            </select>
          </div>

          {/* Special Requests (Max 200 chars) */}
          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1.5 font-semibold">
              <label className="uppercase tracking-wider">Special Requests / Seating Notes</label>
              <span className="font-mono text-[11px]">{specialRequest.length}/200</span>
            </div>
            <textarea
              maxLength={200}
              rows={2}
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="e.g. High chair needed, celebrating anniversary, quiet area..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#E5A84B] resize-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/60 block mb-2 font-semibold">
              Payment Method {totalFee === 0 && '(No Fee Required)'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: 'UPI QR', icon: QrCode },
                { id: 'Card', label: 'Card', icon: CreditCard },
                { id: 'Cash', label: 'At Restaurant', icon: Banknote }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                      paymentMethod === m.id
                        ? 'bg-[#E5A84B]/15 border-[#E5A84B] text-[#E5A84B] font-bold'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI QR Display */}
            {paymentMethod === 'UPI' && totalFee > 0 && (
              <div className="mt-3 p-4 bg-black/40 border border-white/10 rounded-2xl text-center">
                <p className="text-xs text-white/60 mb-2">Scan & Pay ₹{totalFee} via any UPI App</p>
                <div className="bg-white p-3 rounded-xl inline-block shadow-md">
                  <QRCodeSVG
                    value={`upi://pay?pa=dinesphere@upi&pn=DineSphere%20Dining&am=${totalFee}&cu=INR`}
                    size={130}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-2 font-mono">
                  Demo payment QR • Click Confirm to verify
                </p>
              </div>
            )}

            {/* Browser-only Mock Card Fields */}
            {paymentMethod === 'Card' && totalFee > 0 && (
              <div className="mt-3 p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8912"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400/80">
                  🔒 Mock payment: Card numbers are validated locally in your browser and never transmitted.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-4 rounded-full text-xs sm:text-sm text-white font-semibold uppercase tracking-widest cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 outline outline-2 outline-white -outline-offset-[3px]"
            style={{
              background:
                'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
              boxShadow:
                '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset'
            }}
          >
            <span>{isSubmitting ? 'Securing Booking...' : `Confirm Booking (${formatRupees(totalFee)})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
