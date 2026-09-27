import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, LifeBuoy, Clock, ChevronDown, ChevronUp, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';

interface TicketReply {
  id: string;
  author_role: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  replies?: TicketReply[];
}

export const SupportTab: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Support fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/support`,
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSuccessMsg(true);
        setSubject('');
        setMessage('');
        fetchTickets();
        setTimeout(() => setSuccessMsg(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSendingReplyId(ticketId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/customer/support/${ticketId}/reply`,
        { message: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReplyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Submit Ticket Card */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="text-[#E5A84B]" size={22} />
          <h2 className="text-xl font-bold text-white tracking-wide">Concierge & Guest Support</h2>
        </div>
        <p className="text-xs text-white/60 mb-6">
          Have a question about your order, special event planning, or dietary requests? Send our staff a message.
        </p>

        {successMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Your inquiry has been sent to restaurant management. We will respond promptly!</span>
          </div>
        )}

        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
              Inquiry Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Private Dining for Anniversary, Dietary Question..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B]"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-white/60 block mb-1 font-medium">
              Message Details
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your request in detail..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-[#E5A84B] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
            <span>{submitting ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      </div>

      {/* Ticket History */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-wide mb-4">Your Recent Inquiries</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(n => (
              <div key={n} className="h-20 bg-white/[0.03] border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/40 text-xs">
            You have no open inquiries or support tickets.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => {
              const isExpanded = expandedTicketId === t.id;
              const hasReplies = t.replies && t.replies.length > 0;

              return (
                <div
                  key={t.id}
                  className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/20"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-sm">{t.subject}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            t.status === 'Open'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                        {hasReplies && (
                          <span className="text-[10px] bg-[#B600A8]/20 border border-[#B600A8]/40 text-[#D7E2EA] px-2 py-0.5 rounded-full font-medium">
                            {t.replies!.length} {t.replies!.length === 1 ? 'Reply' : 'Replies'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{t.message}</p>
                      <span className="text-[10px] text-white/40 mt-2 block font-mono flex items-center gap-1">
                        <Clock size={10} /> {new Date(t.created_at).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <MessageSquare size={13} />
                      <span>{isExpanded ? 'Hide Thread' : 'View Thread'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Conversation Thread */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-white/5 bg-black/30 space-y-4">
                      <div className="space-y-3">
                        {/* Original message */}
                        <div className="flex items-start gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 shrink-0">
                            <User size={14} />
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">You</span>
                              <span className="text-[10px] text-white/40">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-white/80 mt-1">{t.message}</p>
                          </div>
                        </div>

                        {/* Replies */}
                        {t.replies?.map((rep) => {
                          const isAdmin = rep.author_role === 'admin';
                          return (
                            <div
                              key={rep.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border ${
                                isAdmin
                                  ? 'bg-[#B600A8]/10 border-[#B600A8]/30 ml-4 sm:ml-6'
                                  : 'bg-white/[0.03] border-white/5'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                  isAdmin
                                    ? 'bg-[#B600A8] text-white'
                                    : 'bg-white/10 text-white/60'
                                }`}
                              >
                                {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
                              </div>
                              <div className="flex-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className={`font-bold ${isAdmin ? 'text-[#D7E2EA]' : 'text-white'}`}>
                                    {isAdmin ? 'Staff / Concierge' : 'You'}
                                  </span>
                                  <span className="text-[10px] text-white/40">
                                    {new Date(rep.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <p className="text-white/90 mt-1 leading-relaxed">{rep.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input Box */}
                      {t.status === 'Open' ? (
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={replyText[t.id] || ''}
                            onChange={(e) =>
                              setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendReply(t.id);
                            }}
                            placeholder="Type a reply to our concierge..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E5A84B]"
                          />
                          <button
                            disabled={sendingReplyId === t.id || !replyText[t.id]?.trim()}
                            onClick={() => handleSendReply(t.id)}
                            className="px-4 py-2 bg-[#E5A84B] hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0"
                          >
                            <Send size={13} />
                            <span>{sendingReplyId === t.id ? 'Sending...' : 'Reply'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-white/40 italic text-center py-1">
                          This inquiry is marked as Closed.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
