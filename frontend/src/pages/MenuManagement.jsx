import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UtensilsCrossed,
  Clock,
  Leaf,
  CheckCircle2,
  XCircle,
  Filter,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function MenuManagement() {
  const { settings, hasRole } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [vegFilter, setVegFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    costPrice: '',
    imageUrl: '',
    isAvailable: true,
    preparationTime: 15,
    isVeg: false,
  });

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.categoryId = selectedCategory;
      if (search) params.search = search;
      if (vegFilter !== 'all') params.isVeg = vegFilter === 'veg';

      const [itemsRes, catsRes] = await Promise.all([
        api.get('/menu/items', { params }),
        api.get('/menu/categories'),
      ]);

      if (itemsRes.data?.success) setItems(itemsRes.data.data);
      if (catsRes.data?.success) {
        setCategories(catsRes.data.data);
        if (!formData.categoryId && catsRes.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: catsRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, vegFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMenu();
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentItemId(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      price: '',
      costPrice: '',
      imageUrl: '',
      isAvailable: true,
      preparationTime: 15,
      isVeg: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setCurrentItemId(item.id);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      description: item.description || '',
      price: item.price,
      costPrice: item.costPrice || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || 15,
      isVeg: item.isVeg,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/menu/items/${currentItemId}`, formData);
      } else {
        await api.post('/menu/items', formData);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await api.patch(`/menu/items/${id}/toggle-availability`);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isAvailable: !it.isAvailable } : it))
      );
    } catch (err) {
      alert('Could not update status');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.delete(`/menu/items/${id}`);
        setItems((prev) => prev.filter((it) => it.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu/categories', { name: catName, description: catDesc });
      setCatName('');
      setCatDesc('');
      setIsCatModalOpen(false);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Menu & Culinary Catalog
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Manage signature dishes, prices, descriptions, and dietary preferences
          </p>
        </div>

        {hasRole(['ADMIN', 'MANAGER', 'CHEF']) && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-200 border border-charcoal-700 text-xs font-semibold transition-all"
            >
              + Category
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange hover:to-brand-orange-light text-white text-xs font-bold shadow-lg shadow-brand-orange/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-cream-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish name or description..."
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2 text-xs text-cream-100 placeholder-cream-400/50 focus:outline-none focus:border-brand-orange"
          />
        </form>

        <div className="flex items-center space-x-2.5">
          {/* Veg / Non-veg Filter */}
          <select
            value={vegFilter}
            onChange={(e) => setVegFilter(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Diets</option>
            <option value="veg">Vegetarian Only</option>
            <option value="non-veg">Non-Vegetarian</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25 font-semibold'
              : 'bg-charcoal-850 text-cream-300 hover:bg-charcoal-800 hover:text-white border border-charcoal-800'
          }`}
        >
          All Items ({items.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id.toString())}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === c.id.toString()
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25 font-semibold'
                : 'bg-charcoal-850 text-cream-300 hover:bg-charcoal-800 hover:text-white border border-charcoal-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Dishes Grid */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading culinary items...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No dishes match your filters</p>
          <p className="text-xs text-cream-400 mt-1">Try refining search query or resetting filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-charcoal-900 border transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:border-brand-orange/40 hover:shadow-xl hover:shadow-black/40 ${
                item.isAvailable ? 'border-charcoal-800' : 'border-charcoal-800 opacity-60'
              }`}
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 overflow-hidden bg-charcoal-800">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-black/30" />

                  {/* Veg Indicator */}
                  <span
                    className={`absolute top-3 left-3 p-1.5 rounded-lg border backdrop-blur-md ${
                      item.isVeg
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                        : 'bg-red-950/80 border-red-500 text-red-400'
                    }`}
                    title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                  </span>

                  {/* Price Tag */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-charcoal-900/90 backdrop-blur-md border border-brand-gold/40 text-brand-gold font-serif font-bold text-xs shadow-md">
                    {currency}{Number(item.price).toFixed(2)}
                  </span>

                  {/* Prep Time */}
                  <span className="absolute bottom-2 left-3 flex items-center space-x-1 text-[11px] text-cream-200 bg-charcoal-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <Clock className="w-3 h-3 text-brand-orange" />
                    <span>{item.preparationTime} mins</span>
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cream-400">
                      {item.category?.name}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-cream-50 leading-snug line-clamp-1">
                    {item.name}
                  </h3>

                  <p className="text-xs text-cream-400/80 line-clamp-2 leading-relaxed">
                    {item.description || 'Artisanal dish crafted with seasonal ingredients.'}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-0 border-t border-charcoal-800/60 mt-3 flex items-center justify-between">
                {/* Availability Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center space-x-1.5 text-xs font-semibold transition-colors ${
                    item.isAvailable ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Available</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Sold Out</span>
                    </>
                  )}
                </button>

                {hasRole(['ADMIN', 'MANAGER', 'CHEF']) && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-cream-300 hover:text-brand-gold hover:bg-charcoal-800 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {hasRole(['ADMIN']) && (
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 rounded-lg text-cream-300 hover:text-red-400 hover:bg-charcoal-800 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Menu Item' : 'Add New Culinary Item'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cream-300 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. USDA Prime Filet Mignon"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Price ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="24.50"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Cost Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="7.50"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Prep Time (mins)</label>
              <input
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cream-300 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cream-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ingredients, preparation technique, flavor profile..."
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex items-center space-x-6 sm:col-span-2 pt-2">
              <label className="flex items-center space-x-2 text-xs text-cream-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVeg}
                  onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                  className="rounded bg-charcoal-800 border-charcoal-700 text-brand-orange focus:ring-brand-orange"
                />
                <span>Vegetarian Dish</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-cream-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded bg-charcoal-800 border-charcoal-700 text-brand-orange focus:ring-brand-orange"
                />
                <span>Available for Orders</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium hover:bg-charcoal-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold shadow-md shadow-brand-orange/20"
            >
              {isEditMode ? 'Save Changes' : 'Create Dish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Add Food Category"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Wood-Fired Artisanal Pizzas"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Description</label>
            <input
              type="text"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Brief summary of items in this category"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>
          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium hover:bg-charcoal-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
