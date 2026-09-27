import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminTable, AdminTableBlock } from '../../types/admin';

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [blocks, setBlocks] = useState<AdminTableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showBlocks, setShowBlocks] = useState(false);

  // Table drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AdminTable | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formZone, setFormZone] = useState('Regular');
  const [formSeats, setFormSeats] = useState(4);
  const [formFee, setFormFee] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Block drawer
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [blockTableId, setBlockTableId] = useState('');
  const [blockTimeSlot, setBlockTimeSlot] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const zones = ['Regular', 'Lounge', 'Window', 'Family', 'VIP', 'Bar'];

  const fetchTables = async () => {
    try {
      const res = await adminApi.getTables();
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const res = await adminApi.getTableBlocks(blockDate);
      if (res.data.success) {
        setBlocks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [blockDate]);

  const openAddTable = () => {
    setEditingTable(null);
    setFormLabel('');
    setFormZone('Regular');
    setFormSeats(4);
    setFormFee(0);
    setFormActive(true);
    setDrawerOpen(true);
  };

  const openEditTable = (table: AdminTable) => {
    setEditingTable(table);
    setFormLabel(table.label);
    setFormZone(table.zone);
    setFormSeats(table.seats);
    setFormFee(table.fee);
    setFormActive(table.is_active);
    setDrawerOpen(true);
  };

  const openBlockDrawer = (tableId: string) => {
    setBlockTableId(tableId);
    setBlockTimeSlot('');
    setBlockReason('');
    setBlockDrawerOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    try {
      setSubmitting(true);
      if (editingTable) {
        await adminApi.updateTable(editingTable.id, {
          label: formLabel.trim().toUpperCase(),
          zone: formZone,
          seats: formSeats,
          fee: formFee,
          is_active: formActive
        });
      } else {
        await adminApi.createTable({
          label: formLabel.trim().toUpperCase(),
          zone: formZone,
          seats: formSeats,
          fee: formFee,
          is_active: formActive
        });
      }
      setDrawerOpen(false);
      await fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (id: string, label: string) => {
    if (!window.confirm(`Delete table "${label}"? This is only allowed if there are no future reservations.`)) return;
    try {
      await adminApi.deleteTable(id);
      await fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTableId || !blockReason.trim()) return;

    try {
      setBlockSubmitting(true);
      await adminApi.createTableBlock({
        table_id: blockTableId,
        date: blockDate,
        time_slot: blockTimeSlot || null,
        reason: blockReason.trim()
      });
      setBlockDrawerOpen(false);
      await fetchBlocks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to block table');
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm('Remove this table block?')) return;
    try {
      await adminApi.deleteTableBlock(id);
      await fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const isTableBlocked = (tableId: string) => {
    return blocks.some(b => b.table_id === tableId && (!b.time_slot || b.time_slot === ''));
  };

  const getBlockedSlots = (tableId: string) => {
    return blocks.filter(b => b.table_id === tableId && b.time_slot).map(b => b.time_slot);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tables & Floor Plan</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Manage floor tables, zones, seating, and block tables for maintenance or VIP events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBlocks(!showBlocks)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
              showBlocks
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Lock size={16} />
            <span>{showBlocks ? 'Hide Blocks' : 'Show Blocks'}</span>
          </button>
          <button
            onClick={openAddTable}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs shadow-lg shadow-[#B600A8]/20 hover:brightness-110 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* ── Block Date Selector ── */}
      {showBlocks && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#D7E2EA]/20 text-xs flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-400" />
            <span className="text-white/60">Viewing blocks for:</span>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="bg-black border border-[#D7E2EA]/30 px-3 py-1.5 rounded-xl text-white text-sm outline-none focus:border-[#B600A8]"
            />
          </div>
          <button
            onClick={() => setBlockDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs transition"
          >
            Today
          </button>
          <button
            onClick={() => setBlockDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs transition"
          >
            Tomorrow
          </button>
        </div>
      )}

      {/* ── Floor Map Grid ── */}
      <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center">
            <Grid size={32} className="mx-auto text-white/30 animate-spin mb-4" />
            <p className="text-white/50 text-sm">Loading floor plan...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Zone Groups */}
            {(() => {
              const zonesMap = new Map<string, AdminTable[]>();
              tables.forEach(t => {
                const zone = t.zone || 'Regular';
                if (!zonesMap.has(zone)) zonesMap.set(zone, []);
                zonesMap.get(zone)!.push(t);
              });

              const sortedZones = Array.from(zonesMap.entries()).sort((a, b) => {
                const order = ['Lounge', 'Window', 'VIP', 'Family', 'Regular', 'Bar'];
                return (order.indexOf(a[0]) - order.indexOf(b[0]));
              });

              return sortedZones.map(([zoneName, zoneTables]) => {
                const rowsMap = new Map<string, AdminTable[]>();
                zoneTables.forEach(t => {
                  const row = t.row_label || 'A';
                  if (!rowsMap.has(row)) rowsMap.set(row, []);
                  rowsMap.get(row)!.push(t);
                });

                const sortedRows = Array.from(rowsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                const zoneColors: Record<string, string> = {
                  Lounge: 'bg-purple-500/20 border-purple-500/30',
                  Window: 'bg-cyan-500/20 border-cyan-500/30',
                  VIP: 'bg-amber-500/20 border-amber-500/30',
                  Family: 'bg-emerald-500/20 border-emerald-500/30',
                  Regular: 'bg-white/5 border-white/10',
                  Bar: 'bg-orange-500/20 border-orange-500/30'
                };

                return (
                  <div key={zoneName} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${zoneColors[zoneName] || 'border-white/10 bg-white/5'}`}>
                          {zoneName}
                        </span>
                        <span className="text-xs text-white/40">{zoneTables.length} tables</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">Fee: ₹{zoneTables[0]?.fee || 0} per table</span>
                    </div>

                    <div className="grid grid-cols-6 gap-3" role="grid" aria-label={`Zone ${zoneName}`}>
                      {sortedRows.map(([rowLabel, rowTables]) => {
                        const sortedCols = [...rowTables].sort((a, b) => (a.col_index || 0) - (b.col_index || 0));
                        return (
                          <React.Fragment key={rowLabel}>
                            {sortedCols.map((table) => {
                              const blocked = isTableBlocked(table.id);
                              const hasFutureBooking = false;

                              return (
                                <div
                                  key={table.id}
                                  className={`relative group p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                    !table.is_active
                                      ? 'border-red-500/30 bg-red-500/5 opacity-50'
                                      : blocked
                                      ? 'border-amber-500/50 bg-amber-500/10'
                                      : 'border-white/10 bg-white/[0.03] hover:border-[#B600A8]/60 hover:bg-white/[0.05]'
                                  }`}
                                  onClick={() => openEditTable(table)}
                                >
                                  {blocked && (
                                    <div className="absolute top-1 right-1 z-10">
                                      <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                        <Lock size={12} className="text-white" />
                                      </span>
                                    </div>
                                  )}
                                  <div className="font-bold text-white text-sm mb-1">{table.label}</div>
                                  <div className="flex items-center gap-1 text-[11px] text-white/60 mb-1">
                                    <MapPin size={10} />
                                    <span>{table.seats} seats</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                      !table.is_active
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : blocked
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                      {!table.is_active ? 'Inactive' : blocked ? 'Blocked' : 'Free'}
                                    </span>
                                  </div>
                                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditTable(table); }}
                                      className="w-full px-2 py-1.5 bg-white/10 text-white text-[11px] rounded-lg hover:bg-white/20"
                                    >
                                      <Edit size={12} className="inline mr-1" /> Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openBlockDrawer(table.id); }}
                                      className="w-full px-2 py-1.5 bg-amber-500/20 text-amber-300 text-[11px] rounded-lg hover:bg-amber-500/30"
                                    >
                                      <Lock size={12} className="inline mr-1" /> Block
                                    </button>
                                    {!hasFutureBooking && table.is_active && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.label); }}
                                        className="w-full px-2 py-1.5 bg-red-500/20 text-red-400 text-[11px] rounded-lg hover:bg-red-500/30"
                                      >
                                        <Trash2 size={12} className="inline mr-1" /> Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* ── Current Blocks List ── */}
      {showBlocks && blocks.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-amber-300 flex items-center gap-2">
              <Lock size={18} />
              Active Blocks for {formatDate(blockDate)}
            </h3>
            <span className="text-xs font-mono text-amber-400">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Table {block.table?.label || block.table_id}</div>
                    <div className="text-[11px] text-white/60">
                      {block.time_slot ? `Slot: ${block.time_slot}` : 'Whole day'} • {block.reason}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1.5 text-red-400 hover:text-white rounded-lg hover:bg-red-500/10 transition"
                  title="Remove block"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add/Edit Table Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingTable ? `Edit Table: ${editingTable.label}` : 'Add New Table'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Table Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1, B3, V1"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8]"
                  maxLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Zone *</label>
                  <select
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    className="w-full bg-black border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none"
                  >
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Seats *</label>
                  <select
                    value={formSeats}
                    onChange={(e) => setFormSeats(parseInt(e.target.value))}
                    className="w-full bg-black border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none"
                  >
                    <option value={2}>2 Seats</option>
                    <option value={4}>4 Seats</option>
                    <option value={6}>6 Seats</option>
                    <option value={8}>8 Seats</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Table Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formFee}
                  onChange={(e) => setFormFee(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white font-mono outline-none focus:border-[#B600A8]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-semibold uppercase text-white/70 tracking-wider">Active</label>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-14 h-7 rounded-full relative p-1 flex items-center transition ${
                    formActive ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${
                    formActive ? 'translate-x-7' : 'translate-x-0'
                  }`}>
                    <CheckCircle2 size={10} className={formActive ? 'text-emerald-500' : 'text-white/30'} />
                  </span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-white/20 text-white/70 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 shadow-lg cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Block Table Drawer ── */}
      {blockDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Block Table</h3>
                <p className="text-xs text-white/50">Date: {formatDate(blockDate)}</p>
              </div>
              <button onClick={() => setBlockDrawerOpen(false)} className="p-2 rounded-xl text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Time Slot (Optional)</label>
                <select
                  value={blockTimeSlot}
                  onChange={(e) => setBlockTimeSlot(e.target.value)}
                  className="w-full bg-black border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none"
                >
                  <option value="">Whole Day</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:30">1:30 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="18:30">6:30 PM</option>
                  <option value="19:30">7:30 PM</option>
                  <option value="20:30">8:30 PM</option>
                  <option value="21:30">9:30 PM</option>
                </select>
              </div>

              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maintenance, VIP event, Private party"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-xs text-white outline-none focus:border-[#B600A8]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] font-mono flex justify-between">
                <span className="text-white/50">Table:</span>
                <span className="text-white font-bold">{tables.find(t => t.id === blockTableId)?.label || blockTableId}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-white/20 text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blockSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs hover:brightness-110 shadow-lg cursor-pointer"
                >
                  {blockSubmitting ? 'Blocking...' : 'Block Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TablesPage;