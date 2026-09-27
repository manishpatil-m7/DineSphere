import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminReview } from '../../types/admin';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [ratingFilter, setRatingFilter] = useState('All');
  const [hiddenFilter, setHiddenFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [editReview, setEditReview] = useState<AdminReview | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReviews({
        rating: ratingFilter !== 'All' ? ratingFilter : undefined,
        hidden: hiddenFilter === 'true' ? 'true' : hiddenFilter === 'false' ? 'false' : undefined
      } as any);
      if (res.data.success) {
        setReviews(res.data.data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, hiddenFilter]);

  const toggleHideReview = (id: string) => {
    adminApi.toggleHideReview(id).then(() => fetchReviews());
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReview || !replyMessage.trim()) return;
    try {
      setSubmitting(true);
      await adminApi.replyToReview(editReview.id, replyMessage.trim());
      setEditReview(null);
      setReplyMessage('');
      await fetchReviews();
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (n: number) => {
    const color = n >= 4 ? 'text-amber-400' : n >= 3 ? 'text-amber-500' : 'text-red-400';
    return <span className={`font-medium ${color}`}>{n} Stars</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Reviews</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Read feedback, hide inappropriate comments, and respond to customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviews}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-white/70 hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-white outline-none text-sm"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={hiddenFilter}
            onChange={(e) => setHiddenFilter(e.target.value)}
            className="bg-black/80 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-white outline-none text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="false">Visible to Public</option>
            <option value="true">Hidden</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] text-center text-white/50 text-sm">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-white/60">No reviews found for these filters.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={`p-5 rounded-2xl border transition ${review.is_hidden ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full text-xs">
                      {renderStars(review.rating)}
                    </div>
                    {review.is_hidden && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Hidden</span>
                    )}
                  </div>
                  <div className="text-sm text-white/90 mb-4 leading-relaxed font-medium">
                    "{review.comment || 'No written comment'}"
                  </div>
                  <div className="text-xs text-white/40 mb-4">
                    From {(review as any).customer_name || 'Verified Customer'} • {new Date(review.created_at).toLocaleDateString()}
                  </div>
                  
                  {review.admin_reply && (
                    <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 relative">
                      <div className="absolute -top-2 left-3 bg-[#1A1A1A] px-1 text-[10px] text-white/40 font-semibold uppercase tracking-wider">Your Reply</div>
                      {review.admin_reply}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => toggleHideReview(review.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${review.is_hidden ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                  >
                    {review.is_hidden ? <><Eye size={14} /> Show Publicly</> : <><EyeOff size={14} /> Hide Review</>}
                  </button>
                  {!review.admin_reply && (
                    <button
                      onClick={() => { setEditReview(review); setReplyMessage(''); }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#B600A8]/20 text-[#B600A8] hover:bg-[#B600A8]/30 transition"
                    >
                      <MessageSquare size={14} /> Reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {editReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Reply to Customer</h3>
              <p className="text-xs text-white/50">Your response will be visible publicly under the review.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-sm text-white/80 italic border-l-4 border-white/20">
              "{editReview.comment}"
            </div>
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write a friendly and professional response..."
                className="w-full bg-white/5 border border-[#D7E2EA]/30 p-4 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] resize-none"
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditReview(null)} className="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-sm disabled:opacity-50 hover:brightness-110">
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;