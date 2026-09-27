import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  DollarSign,
  Trash2,
  Edit,
  CheckCircle,
  X,
  PackagePlus,
  TrendingDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminInventoryItem } from '../../types/admin';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminInventoryItem | null>(null);
  const [adjustModalItem, setAdjustModalItem] = useState<AdminInventoryItem | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemThreshold, setItemThreshold] = useState<number>(5);
  const [itemCost, setItemCost] = useState<number>(100);

  // Adjust stock states
  const [adjustType, setAdjustType] = useState<'restock' | 'wastage'>('restock');
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getInventory({
        search: search || undefined,
        low: lowOnly
      });
      if (res.data.success) {
        setItems(res.data.data.items);
        setTotalValue(res.data.data.totalValue);
        setLowStockCount(res.data.data.lowStockCount);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, lowOnly]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAdd = () => {
    setEditItem(null);
    setItemName('');
    setItemUnit('kg');
    setItemQty(20);
    setItemThreshold(5);
    setItemCost(200);
    setAddModalOpen(true);
  };

  const openEdit = (item: AdminInventoryItem) => {
    setEditItem(item);
    setItemName(item.name);
    setItemUnit(item.unit);
    setItemQty(item.quantity);
    setItemThreshold(item.low_threshold);
    setItemCost(item.cost_per_unit);
    setAddModalOpen(true);
  };

  const openAdjust = (item: AdminInventoryItem) => {
    setAdjustModalItem(item);
    setAdjustType('restock');
    setAdjustAmount(5);
    setAdjustReason('Weekly distributor replenishment');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemUnit) return;

    try {
      setSubmitting(true);
      if (editItem) {
        await adminApi.updateInventoryItem(editItem.id, {
          name: itemName.trim(),
          unit: itemUnit,
          low_threshold: Number(itemThreshold),
          cost_per_unit: Number(itemCost)
        });
      } else {
        await adminApi.createInventoryItem({
          name: itemName.trim(),
          unit: itemUnit,
          quantity: Number(itemQty),
          low_threshold: Number(itemThreshold),
          cost_per_unit: Number(itemCost)
        });
      }
      setAddModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem || adjustAmount <= 0 || !adjustReason.trim()) return;

    try {
      setSubmitting(true);
      const delta = adjustType === 'restock' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
      await adminApi.adjustInventoryStock(adjustModalItem.id, delta, `${adjustType.toUpperCase()}: ${adjustReason.trim()}`);
      setAdjustModalItem(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete inventory ingredient "${name}"?`)) return;
    try {
      await adminApi.deleteInventoryItem(id);
      await fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Stock & Inventory</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Monitor raw ingredients and manage stock replenishments easily.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLowOnly(!lowOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
              lowOnly
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <AlertTriangle size={16} />
            <span>{lowOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}</span>
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs shadow-lg shadow-[#B600A8]/20 hover:brightness-110 cursor-pointer transition"
          >
            <Plus size={16} />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* ── Total Valuation Widget ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-white/50 tracking-wider">Total Value</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mt-1">
              ₹{totalValue.toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/[0.03] flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-amber-400/80 tracking-wider">Low Stock Warnings</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono mt-1">
              {lowStockCount} items
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-white/50 tracking-wider">Catalogued Items</div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono mt-1">
              {items.length} items
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/60 flex items-center justify-center font-bold">
            <Boxes size={24} />
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-2.5 text-[#D7E2EA]/40" />
          <input
            type="text"
            placeholder="Search ingredient by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-[#D7E2EA]/20 pl-10 pr-3 py-2.5 rounded-xl text-white outline-none focus:border-[#B600A8] transition text-sm"
          />
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase font-medium">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">More Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Boxes size={48} className="text-white/10 mb-4" />
                      <h4 className="text-white font-bold mb-2">No inventory items found</h4>
                      <p className="text-white/40 text-xs mb-6 max-w-sm">
                        {search || lowOnly ? 'Try adjusting your search filters.' : 'Your inventory is currently empty. Start tracking ingredients!'}
                      </p>
                      {!search && !lowOnly && (
                        <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition cursor-pointer">
                          Add First Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                const isLow = item.quantity <= item.low_threshold;
                const isExpanded = expandedRows[item.id];
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`transition cursor-pointer group ${isLow ? 'hover:bg-amber-500/[0.08]' : 'hover:bg-white/[0.04]'}`}
                      onClick={() => toggleRow(item.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-white/90 flex items-center gap-2">
                        {isLow && <AlertTriangle size={16} className="text-amber-400 shrink-0" />}
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className={isLow ? 'text-amber-400 font-bold' : 'text-white'}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                            isLow
                              ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 animate-pulse'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-white/40 group-hover:text-white/80 transition">
                        {isExpanded ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-black/30 border-t-0">
                        <td colSpan={4} className="p-5">
                          <div className="flex flex-col sm:flex-row gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <div className="flex-1 space-y-4">
                              <h4 className="text-sm font-bold text-white">Item Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Cost Per Unit</span>
                                  <span className="text-white">₹{item.cost_per_unit} / {item.unit}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Total Value</span>
                                  <span className="text-white">₹{(item.cost_per_unit * item.quantity).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Low Stock Threshold</span>
                                  <span className="text-amber-400">{item.low_threshold} {item.unit}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Item ID</span>
                                  <span className="text-white/60 text-[10px]">{item.id}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="w-full sm:w-56 shrink-0 flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Quick Actions</h4>
                              <button
                                onClick={(e) => { e.stopPropagation(); openAdjust(item); }}
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-xs hover:brightness-110 transition"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                                className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 transition text-xs"
                              >
                                Edit Settings
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id, item.name); }}
                                className="w-full py-2 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 transition text-xs"
                              >
                                Delete Item
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Item Modal ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editItem ? `Edit: ${editItem.name}` : 'Add New Inventory Ingredient'}
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-2 rounded-xl text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Butter"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none focus:border-[#B600A8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-black border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white outline-none"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="litre">Litre (litre)</option>
                    <option value="piece">Piece (piece)</option>
                    <option value="gram">Gram (gram)</option>
                  </select>
                </div>

                {!editItem && (
                  <div>
                    <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                      Initial Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={itemQty}
                      onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white font-mono outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                    Low Stock Threshold *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                    Cost per Unit (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={itemCost}
                    onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-white/20 text-white/70 hover:text-white text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Adjust Stock Dialog ── */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">Adjust Stock</h3>
                <p className="text-xs text-white/50">{adjustModalItem.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-2 rounded-xl text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('restock')}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      adjustType === 'restock'
                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    <PackagePlus size={16} />
                    <span>Restock (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('wastage')}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      adjustType === 'wastage'
                        ? 'border-red-500/60 bg-red-500/20 text-red-300'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    <TrendingDown size={16} />
                    <span>Wastage (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                  Quantity ({adjustModalItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-semibold uppercase text-white/70 tracking-wider block mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supplier delivery invoice #INV-9821 or Spoilage"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-white/5 border border-[#D7E2EA]/30 p-3 rounded-2xl text-xs text-white outline-none focus:border-[#B600A8]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] font-mono flex justify-between">
                <span className="text-white/50">Current Stock:</span>
                <span className="text-white font-bold">{adjustModalItem.quantity} {adjustModalItem.unit}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2.5 rounded-2xl border border-white/20 text-white/70 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs hover:brightness-110 shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryPage;
