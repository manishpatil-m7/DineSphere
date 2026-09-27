import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminAnnouncement } from '../../types/admin';

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || message.length > 300) return;
    try {
      setSending(true);
      await adminApi.sendAnnouncement({ title, message, audience });
      alert('Announcement sent successfully!');
      setTitle('');
      setMessage('');
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to send announcement:', err);
      alert('Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Announcements</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Broadcast messages to specific customer segments
          </p>
        </div>
        <button
          onClick={fetchAnnouncements}
          className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:bg-white/10 cursor-pointer flex items-center gap-2 text-xs"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Announcement Form */}
      <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
        <h3 className="text-base font-bold text-white mb-4">Send Announcement</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-white/70 tracking-wider block mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8]"
              maxLength={100}
              placeholder="e.g. Weekend Special Offer"
            />
            <p className="text-[11px] text-white/40 mt-1">Max 100 characters</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-white/70 tracking-wider block mb-1">
              Message (max 300 chars)
            </label>
            <textarea
              rows={4}
              placeholder="Announce new menu items, special promotions, or important updates"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8] resize-none"
              maxLength={300}
            />
            <p className="text-[11px] text-white/40 mt-1 text-right">{message.length} / 300</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-white/70 tracking-wider block mb-1">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8]"
            >
              <option value="all">All Customers</option>
              <option value="gold_and_above">Gold and Above</option>
              <option value="inactive_30d">Inactive 30 Days</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={sending || !title || !message}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold text-xs hover:brightness-110 shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Megaphone size={15} />
            {sending ? 'Sending...' : 'Send Announcement'}
          </button>
        </form>
      </div>

      {/* Announcement History */}
      <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Announcements</h3>
          <AlertCircle size={16} className="text-white/40" />
        </div>

        {loading ? (
          <div className="text-center py-8 text-white/40 text-sm">Loading...</div>
        ) : announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-2xl border border-[#D7E2EA]/10 bg-white/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white block truncate">{ann.title}</span>
                    <p className="text-white/60 text-sm mt-1">{ann.message}</p>
                  </div>
                  <span className="text-[11px] text-[#B600A8] bg-[#B600A8]/10 px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                    {ann.audience}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40 italic text-sm">
            No announcements yet. Send your first message above!
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;