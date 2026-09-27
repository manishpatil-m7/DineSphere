import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Upload,
  Archive,
  RefreshCcw,
  Check,
  X,
  Edit,
  Star,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import type { AdminDish, AdminInventoryItem, DishIngredientItem } from '../../types/admin';

export const MenuPage: React.FC = () => {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [inventoryItems, setInventoryItems] = useState<AdminInventoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Drawer / Modal state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<AdminDish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<{ item_id: string; qty_per_dish: number }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Starters');
  const [formPrice, setFormPrice] = useState<number>(300);
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  const categories = ['Starters', 'Main Course', 'Desserts', 'Drinks'];

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDishes({
        search: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        archived: showArchived ? 'true' : 'false'
      });
      if (res.data.success) {
        setDishes(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await adminApi.getInventory();
      if (res.data.success) {
        setInventoryItems(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [search, categoryFilter, showArchived]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddDish = () => {
    setEditingDish(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('Starters');
    setFormPrice(350);
    setFormIsVeg(true);
    setFormIsAvailable(true);
    setImageFile(null);
    setImagePreview(null);
    setDishIngredients([]);
    setEditDrawerOpen(true);
  };

  const openEditDish = async (dish: AdminDish) => {
    setEditingDish(dish);
    setFormName(dish.name);
    setFormDesc(dish.description || '');
    setFormCategory(dish.category);
    setFormPrice(dish.price);
    setFormIsVeg(dish.is_veg);
    setFormIsAvailable(dish.is_available);
    setImageFile(null);
    setImagePreview(dish.image_url || null);

    try {
      const ingRes = await adminApi.getDishIngredients(dish.id);
      if (ingRes.data.success) {
        setDishIngredients(
          ingRes.data.data.map((i) => ({
            item_id: i.item_id,
            qty_per_dish: i.qty_per_dish
          }))
        );
      }
    } catch {
      setDishIngredients([]);
    }

    setEditDrawerOpen(true);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be 2 MB or smaller.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleAvailability = async (dish: AdminDish) => {
    try {
      await adminApi.updateDishAvailability(dish.id, !dish.is_available);
      setDishes(dishes.map((d) => (d.id === dish.id ? { ...d, is_available: !d.is_available } : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveDish = async (dish: AdminDish) => {
    const actionText = dish.is_archived ? 'restore' : 'archive';
    if (!window.confirm(`Are you sure you want to ${actionText} "${dish.name}"?`)) return;

    try {
      if (dish.is_archived) {
        await adminApi.updateDish(dish.id, { is_archived: false, is_available: true });
      } else {
        await adminApi.archiveDish(dish.id);
      }
      await fetchDishes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory || formPrice <= 0) return;

    try {
      setSubmitting(true);
      let dishId = editingDish?.id;

      if (editingDish) {
        await adminApi.updateDish(editingDish.id, {
          name: formName.trim(),
          description: formDesc.trim(),
          category: formCategory,
          price: Number(formPrice),
          is_veg: formIsVeg,
          is_available: formIsAvailable
        });
      } else {
        const createRes = await adminApi.createDish({
          name: formName.trim(),
          description: formDesc.trim(),
          category: formCategory,
          price: Number(formPrice),
          is_veg: formIsVeg,
          is_available: formIsAvailable
        });
        dishId = createRes.data.data.id;
      }

      // If image uploaded, save it
      if (imageFile && dishId) {
        await adminApi.uploadDishImage(dishId, imageFile);
      }

      // Save ingredients
      if (dishId) {
        await adminApi.saveDishIngredients(dishId, dishIngredients);
      }

      setEditDrawerOpen(false);
      await fetchDishes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save dish');
    } finally {
      setSubmitting(false);
    }
  };

  const addIngredientRow = () => {
    if (inventoryItems.length === 0) return;
    setDishIngredients([
      ...dishIngredients,
      { item_id: inventoryItems[0].id, qty_per_dish: 0.1 }
    ]);
  };

  const removeIngredientRow = (index: number) => {
    setDishIngredients(dishIngredients.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Culinary Menu Management</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Configure menu dishes, recipe ingredients, images, and live customer visibility
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
              showArchived
                ? 'border-[#B600A8]/60 bg-[#B600A8]/20 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Archive size={16} />
            <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-white/[0.04] border border-[#D7E2EA]/20 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>

          <button
            onClick={openAddDish}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs shadow-lg shadow-[#B600A8]/20 hover:brightness-110 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-[#D7E2EA]/20 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-2.5 text-[#D7E2EA]/40" />
          <input
            type="text"
            placeholder="Search dish title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-[#D7E2EA]/20 pl-10 pr-3 py-2 rounded-xl text-white outline-none focus:border-[#B600A8]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dishes View ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02]">
              <UtensilsCrossed size={48} className="text-white/10 mb-4" />
              <h4 className="text-white font-bold mb-2">No menu dishes found</h4>
              <p className="text-white/40 text-xs mb-6 max-w-sm">
                {search || categoryFilter !== 'All' ? 'Try adjusting your search filters.' : 'Your restaurant menu is currently empty.'}
              </p>
              {!search && categoryFilter === 'All' && (
                <button onClick={openAddDish} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition cursor-pointer">
                  Create First Dish
                </button>
              )}
            </div>
          ) : (
            dishes.map((d) => (
            <div
              key={d.id}
              className={`rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                d.is_archived
                  ? 'border-red-500/20 bg-red-500/[0.02] opacity-60'
                  : !d.is_available
                  ? 'border-white/10 bg-white/[0.01] opacity-75'
                  : 'border-[#D7E2EA]/25 bg-white/[0.03] hover:border-[#B600A8]/60 shadow-lg'
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                  <img
                    src={d.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                    alt={d.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Veg indicator & Rating */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center bg-black/70 ${
                        d.is_veg ? 'border-emerald-400' : 'border-red-500'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${d.is_veg ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-sm">
                      {d.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-amber-400 text-xs font-bold font-mono backdrop-blur-sm">
                    <Star size={12} fill="#F59E0B" /> {d.rating}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                      {d.name}
                    </h3>
                    <span className="text-base font-bold font-mono text-emerald-400 shrink-0 ml-2">
                      ₹{d.price}
                    </span>
                  </div>
                  <p className="text-xs text-[#D7E2EA]/60 line-clamp-2 leading-relaxed">
                    {d.description || 'Artisan chef recipe prepared fresh with luxury ingredients.'}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0 border-t border-white/5 mt-2 flex items-center justify-between">
                {/* Availability Toggle */}
                <button
                  onClick={() => handleToggleAvailability(d)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                    d.is_available
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/40 bg-red-500/10 text-red-400'
                  }`}
                >
                  {d.is_available ? 'Available' : 'Unavailable'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditDish(d)}
                    className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
                    title="Edit dish & recipe"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleArchiveDish(d)}
                    className={`p-2 rounded-xl transition ${
                      d.is_archived
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-red-400 hover:bg-red-500/10'
                    }`}
                    title={d.is_archived ? 'Restore dish' : 'Archive dish'}
                  >
                    {d.is_archived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl border border-[#D7E2EA]/20 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D7E2EA]/15 bg-white/[0.03] text-white/50 text-xs uppercase font-medium">
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">More Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dishes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-center">
                        <UtensilsCrossed size={48} className="text-white/10 mb-4" />
                        <h4 className="text-white font-bold mb-2">No menu dishes found</h4>
                        <p className="text-white/40 text-xs mb-6 max-w-sm">
                          {search || categoryFilter !== 'All' ? 'Try adjusting your search filters.' : 'Your restaurant menu is currently empty.'}
                        </p>
                        {!search && categoryFilter === 'All' && (
                          <button onClick={openAddDish} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition cursor-pointer">
                            Create First Dish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  dishes.map((d) => {
                  const isExpanded = expandedRows[d.id];
                  return (
                    <React.Fragment key={d.id}>
                      <tr 
                        className="hover:bg-white/[0.04] transition cursor-pointer group"
                        onClick={() => toggleRow(d.id)}
                      >
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={d.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <span className="font-bold text-white">{d.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">₹{d.price}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${
                              d.is_available
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                : 'border-red-500/40 bg-red-500/10 text-red-400'
                            }`}
                          >
                            {d.is_available ? 'Available' : 'Unavailable'}
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
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  Dish Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Category</span>
                                    <span className="text-white font-medium">{d.category}</span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Dietary Type</span>
                                    <span className={d.is_veg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                      {d.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Customer Rating</span>
                                    <span className="text-amber-400 font-bold flex items-center gap-1">
                                      <Star size={12} fill="#F59E0B" /> {d.rating}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Dish ID</span>
                                    <span className="text-white/60 font-mono text-[10px]">{d.id}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Description</span>
                                  <span className="text-white/80">{d.description || 'No description provided.'}</span>
                                </div>
                              </div>
                              <div className="w-full sm:w-56 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 space-y-3">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Quick Actions</h4>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEditDish(d); }}
                                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 transition"
                                  >
                                    <Edit size={14} /> Edit Details & Recipe
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleAvailability(d); }}
                                    className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs transition"
                                  >
                                    Mark {d.is_available ? 'Unavailable' : 'Available'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleArchiveDish(d); }}
                                    className={`py-2 rounded-xl border border-transparent font-medium text-xs transition ${
                                      d.is_archived
                                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    }`}
                                  >
                                    {d.is_archived ? 'Restore to Menu' : 'Archive Dish'}
                                  </button>
                                </div>
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
      )}

      {/* ── Edit / Add Dish Drawer Modal ── */}
      {editDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7E2EA]/10 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingDish ? `Edit Dish: ${editingDish.name}` : 'Create New Menu Dish'}
              </h3>
              <button
                onClick={() => setEditDrawerOpen(false)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                  Dish Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Truffle Tagliatelle"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white font-mono outline-none focus:border-[#B600A8] transition"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                    Dietary
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormIsVeg(!formIsVeg)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      formIsVeg
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${formIsVeg ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    <span>{formIsVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                  Culinary Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients and culinary notes for the guest..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-black/40 border border-[#D7E2EA]/20 p-3 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                />
              </div>

              {/* Image Upload with Preview */}
              <div>
                <label className="text-[11px] font-bold uppercase text-white/70 tracking-wider block mb-1">
                  Dish Presentation Image (Max 2 MB, JPG/PNG/WebP)
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover border border-[#D7E2EA]/30"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    className="text-xs text-white/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Recipe Ingredients Mapping */}
              <div className="border-t border-white/10 pt-4 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Recipe Inventory Ingredients
                    </h4>
                    <p className="text-[10px] text-white/50">
                      Auto-deducted from inventory stock whenever an order is prepped
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dishIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <select
                        value={ing.item_id}
                        onChange={(e) => {
                          const copy = [...dishIngredients];
                          copy[idx].item_id = e.target.value;
                          setDishIngredients(copy);
                        }}
                        className="flex-1 bg-black/40 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-sm text-white outline-none focus:border-[#B600A8] transition"
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        min="0.001"
                        value={ing.qty_per_dish}
                        onChange={(e) => {
                          const copy = [...dishIngredients];
                          copy[idx].qty_per_dish = parseFloat(e.target.value) || 0;
                          setDishIngredients(copy);
                        }}
                        placeholder="Qty"
                        className="w-24 bg-black/40 border border-[#D7E2EA]/20 px-3 py-2 rounded-xl text-sm text-white font-mono outline-none focus:border-[#B600A8] transition"
                      />

                      <button
                        type="button"
                        onClick={() => removeIngredientRow(idx)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {dishIngredients.length === 0 && (
                    <div className="text-center py-4 text-white/40 text-xs italic">
                      No ingredients added to this recipe yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Form submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setEditDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-xs text-white/70 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-bold text-xs hover:brightness-110 shadow-lg transition shadow-[#B600A8]/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDish ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MenuPage;
