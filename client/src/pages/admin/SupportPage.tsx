import React, { useState, useEffect } from 'react';
import {
  HeadphonesIcon,
  X,
  Search,
  Eye,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminTicket } from '../../types/admin';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [loadingReply, setLoadingReply] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getTickets(statusFilter === 'All' ? undefined : statusFilter);
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: 'Open' | 'Closed') => {
    try {
      setLoadingReply(true);
      await adminApi.updateTicketStatus(id, status);
      await fetchTickets();
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(null); // Close modal if open
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    try {
      setLoadingReply(true);
      await adminApi.replyToTicket(selectedTicket.id, replyMessage);
      setReplyMessage('');
      setSelectedTicket(null);
      await fetchTickets();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setLoadingReply(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Support Center</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Resolve customer issues and answer queries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearch('')}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:text-white transition cursor-pointer"
          >
            <Search size={16} />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-white outline-none text-sm cursor-pointer"
          >
            <option value="All">All Issues</option>
            <option value="Open">Needs Attention (Open)</option>
            <option value="Closed">Resolved (Closed)</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="overflow-hidden rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02]">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Clock className="animate-spin text-[#B600A8]" size={24} />
            <p className="text-sm text-white/50">Loading support history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase font-medium">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Responses</th>
                  <th className="py-3 px-4 text-right">More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-white/40 italic">
                      No support issues found for these filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => {
                    const isExpanded = expandedRows[ticket.id];
                    const replies = ticket.replies || [];
                    return (
                      <React.Fragment key={ticket.id}>
                        <tr className="hover:bg-white/[0.04] transition group">
                          <td className="py-3.5 px-4 font-medium text-white/90">
                            {(ticket as any).customer_name || 'Guest User'}
                          </td>
                          <td className="py-3.5 px-4 text-white/80 max-w-xs truncate">
                            {ticket.subject}
                          </td>
                          <td className="py-3.5 px-4">
                            {ticket.status === 'Open' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400">Needs Reply</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/50">Resolved</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-white/70 font-mono text-xs">
                              {replies.length}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => toggleRow(ticket.id)}
                              className="text-white/40 group-hover:text-white/80 transition p-1"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-black/30 border-t-0">
                            <td colSpan={5} className="p-5">
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Original Message</span>
                                    <div className="mt-1 p-3 rounded-xl bg-white/5 text-sm text-white/80 whitespace-pre-wrap">
                                      {/* Using subject as message since API model seems minimal */}
                                      {ticket.subject}
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-1">Submitted on {new Date(ticket.created_at).toLocaleString()}</div>
                                  </div>
                                  
                                  {replies.length > 0 && (
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Conversation History</span>
                                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {replies.map((reply: any, i: number) => (
                                          <div key={i} className={`p-3 rounded-xl text-xs ${reply.from_admin ? 'bg-[#B600A8]/10 border border-[#B600A8]/20 ml-8' : 'bg-white/5 border border-white/10 mr-8'}`}>
                                            <div className={`font-bold mb-1 ${reply.from_admin ? 'text-[#B600A8]' : 'text-white/60'}`}>
                                              {reply.from_admin ? 'Support Team' : 'Customer'}
                                            </div>
                                            <div className="text-white/80">{reply.message}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Actions</span>
                                  {ticket.status === 'Open' ? (
                                    <>
                                      <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 transition"
                                      >
                                        <MessageCircle size={14} /> Send Reply
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(ticket.id, 'Closed')}
                                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs transition"
                                      >
                                        Mark as Resolved
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleStatusChange(ticket.id, 'Open')}
                                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs transition"
                                    >
                                      Reopen Issue
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Reply to Customer</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                rows={5}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response here. The customer will receive this message."
                className="w-full bg-white/5 border border-[#D7E2EA]/30 p-4 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] resize-none"
                required
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedTicket(null)} 
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/70 text-xs font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loadingReply} 
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs disabled:opacity-50"
                >
                  {loadingReply ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupportPage;