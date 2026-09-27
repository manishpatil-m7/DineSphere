import React, { useState, useEffect } from 'react';
import { Clock, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminAuditAction } from '../../types/admin';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditAction[]>([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchLogs = async (p = page, entity = entityFilter) => {
    try {
      setLoading(true);
      const params: any = { page: p, limit };
      if (entity.trim() && entity !== 'All') params.entity = entity.trim();

      const res = await adminApi.getAuditLog(params);
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
        // Handle TS issue with pagination object vs direct total
        setTotalCount((res.data.data.pagination as any)?.total || (res.data.data as any).total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, entityFilter);
  }, [page, entityFilter]);

  const handleFilterClick = (filter: string) => {
    setEntityFilter(filter === 'All' ? '' : filter);
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const filterChips = ['All', 'Order', 'Customer', 'Setting', 'Inventory', 'Menu'];

  const buildActionSentence = (log: AdminAuditAction) => {
    const entity = log.entity;
    const idShort = log.entity_id ? log.entity_id.slice(0, 8) : '';
    let detailsObj: any = {};
    try {
      if (log.details && typeof log.details === 'string' && log.details.startsWith('{')) {
        detailsObj = JSON.parse(log.details);
      }
    } catch (e) {}

    switch (log.action) {
      case 'STATUS_CHANGE':
        return `${entity} #${idShort} status updated to ${detailsObj.status || 'a new state'}`;
      case 'CUSTOMER_TOGGLE':
        return `Customer #${idShort} was ${detailsObj.is_active ? 'enabled' : 'disabled'}`;
      case 'UPDATE_SETTING':
        return `System settings were updated`;
      case 'CREATE':
        return `New ${entity} #${idShort} was created`;
      case 'UPDATE':
        return `${entity} #${idShort} was updated`;
      case 'DELETE':
        return `${entity} #${idShort} was removed`;
      default:
        return `${log.action.replace(/_/g, ' ').toLowerCase()} action performed on ${entity}`;
    }
  };

  const groupLogsByDate = () => {
    const groups: Record<string, AdminAuditAction[]> = {};
    logs.forEach(log => {
      const d = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (d.toDateString() === today.toDateString()) dateLabel = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';

      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(log);
    });
    return groups;
  };

  const groupedLogs = groupLogsByDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Audit Log</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Review recent system events and administrative actions in plain English.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-white/60 text-xs mr-2">
          <Filter size={14} />
          <span>Filter:</span>
        </div>
        {filterChips.map(chip => {
          const isActive = (chip === 'All' && !entityFilter) || entityFilter === chip;
          return (
            <button
              key={chip}
              onClick={() => handleFilterClick(chip)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#B600A8] text-white shadow-md'
                  : 'bg-white/[0.04] text-white/60 border border-[#D7E2EA]/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Clock className="animate-spin text-[#B600A8]" size={24} />
            <p className="text-xs text-white/50">Loading activity...</p>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <Info className="text-white/20 mb-2" size={32} />
            <p className="text-sm text-white/60">No recent activity found for these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase font-medium tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Action Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(groupedLogs).map(([dateLabel, dayLogs]) => (
                  <React.Fragment key={dateLabel}>
                    <tr className="bg-black/20">
                      <td colSpan={3} className="py-2 px-4 text-[11px] font-bold uppercase text-white/40 tracking-wider">
                        {dateLabel}
                      </td>
                    </tr>
                    {dayLogs.map((log) => {
                      const isExpanded = !!expandedRows[log.id];
                      return (
                        <React.Fragment key={log.id}>
                          <tr 
                            onClick={() => toggleRow(log.id)}
                            className="hover:bg-white/[0.04] transition cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 text-white/60 whitespace-nowrap text-xs">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-white/90">
                              {buildActionSentence(log)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button className="text-white/40 group-hover:text-white/80 transition p-1">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-black/30 border-t-0">
                              <td colSpan={3} className="py-3 px-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-white/40 block mb-1">Entity Reference</span>
                                    <span className="font-mono text-white/80 bg-white/5 px-2 py-1 rounded">
                                      {log.entity} {log.entity_id ? `(${log.entity_id})` : ''}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1">Raw Action Data</span>
                                    <div className="font-mono text-white/70 bg-white/5 p-2 rounded max-w-full overflow-x-auto whitespace-pre-wrap">
                                      {log.details || 'No additional data'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > limit && (
          <div className="flex items-center justify-between p-4 border-t border-[#D7E2EA]/10 bg-white/[0.01]">
            <span className="text-xs text-white/50">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;