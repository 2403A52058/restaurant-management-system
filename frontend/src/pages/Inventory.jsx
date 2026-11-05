import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Truck,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  DollarSign,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Inventory() {
  const { settings, hasRole } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // stock | suppliers | transactions
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);

  // Form States
  const [ingForm, setIngForm] = useState({
    name: '',
    category: 'Produce',
    currentStock: 10,
    unit: 'kg',
    minThreshold: 5,
    unitCost: 15,
  });

  const [supForm, setSupForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    suppliedItems: '',
  });

  const [txnForm, setTxnForm] = useState({
    ingredientId: '',
    supplierId: '',
    type: 'PURCHASE',
    quantity: 5,
    unitCost: '',
    notes: '',
  });

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [ingRes, supRes, txnRes] = await Promise.all([
        api.get('/inventory/ingredients', { params: { lowStock: lowStockOnly ? 'true' : undefined } }),
        api.get('/inventory/suppliers'),
        api.get('/inventory/transactions'),
      ]);

      if (ingRes.data?.success) {
        setIngredients(ingRes.data.data);
        if (!txnForm.ingredientId && ingRes.data.data.length > 0) {
          setTxnForm((prev) => ({ ...prev, ingredientId: ingRes.data.data[0].id }));
        }
      }
      if (supRes.data?.success) {
        setSuppliers(supRes.data.data);
        if (!txnForm.supplierId && supRes.data.data.length > 0) {
          setTxnForm((prev) => ({ ...prev, supplierId: supRes.data.data[0].id }));
        }
      }
      if (txnRes.data?.success) setTransactions(txnRes.data.data);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [lowStockOnly]);

  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/ingredients', ingForm);
      setIsIngModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save ingredient');
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/suppliers', supForm);
      setIsSupModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/transactions', txnForm);
      setIsTxnModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record transaction');
    }
  };

  const categories = ['Produce', 'Dairy', 'Meat', 'Spices', 'Bakery', 'Beverages', 'Dry Goods'];
  const units = ['kg', 'g', 'l', 'ml', 'pcs', 'packs'];

  const lowStockCount = ingredients.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Pantry & Raw Inventory Management
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Stock levels, automated low-stock warnings, purchase requisitions, and audit logs
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchInventoryData}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsTxnModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-brand-gold border border-brand-gold/30 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Stock In/Out</span>
          </button>

          {hasRole(['ADMIN', 'MANAGER']) && (
            <button
              onClick={() => setIsIngModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Ingredient</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>
              <strong>Low Stock Warning:</strong> {lowStockCount} ingredient{lowStockCount > 1 ? 's are' : ' is'} below minimum threshold. Reorder from suppliers immediately.
            </span>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-bold text-red-200 transition-colors"
          >
            {lowStockOnly ? 'Show All Stock' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'stock'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-cream-400 hover:text-white'
          }`}
        >
          Ingredients Stock ({ingredients.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-cream-400 hover:text-white'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'transactions'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-cream-400 hover:text-white'
          }`}
        >
          Stock Audit Log ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Ingredients Grid */}
      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ingredients.map((ing) => {
            const stockPct = Math.min(
              100,
              Math.round((ing.currentStock / (ing.minThreshold * 2.5)) * 100)
            );

            return (
              <div
                key={ing.id}
                className={`p-4 rounded-2xl bg-charcoal-900 border transition-all flex flex-col justify-between ${
                  ing.isLowStock
                    ? 'border-red-500/50 bg-red-950/10'
                    : 'border-charcoal-800 hover:border-charcoal-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">
                      {ing.category}
                    </span>
                    {ing.isLowStock && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-sm text-cream-50 leading-tight">
                    {ing.name}
                  </h3>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-bold font-mono text-cream-100">
                        {ing.currentStock} {ing.unit}
                      </span>
                      <span className="text-[10px] text-cream-400">
                        Min: {ing.minThreshold} {ing.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-charcoal-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ing.isLowStock ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-charcoal-800 mt-4 flex items-center justify-between text-xs text-cream-400">
                  <span>Unit Cost: {currency}{ing.unitCost.toFixed(2)}</span>
                  <button
                    onClick={() => {
                      setTxnForm({
                        ...txnForm,
                        ingredientId: ing.id,
                        type: 'PURCHASE',
                      });
                      setIsTxnModalOpen(true);
                    }}
                    className="text-brand-orange hover:text-brand-orange-light font-bold"
                  >
                    + Restock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsSupModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              + Add Supplier
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-cream-50">{sup.name}</h3>
                  <span className="text-[10px] text-brand-gold font-bold px-2 py-0.5 rounded-full bg-brand-gold/10 border border-brand-gold/30">
                    Active Vendor
                  </span>
                </div>
                <p className="text-xs text-cream-300">{sup.contactPerson && `Rep: ${sup.contactPerson}`}</p>
                <div className="text-xs text-cream-400 space-y-0.5 pt-2 border-t border-charcoal-800">
                  <p>Phone: {sup.phone}</p>
                  {sup.email && <p>Email: {sup.email}</p>}
                  {sup.suppliedItems && <p className="italic text-cream-400/80">Provides: {sup.suppliedItems}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Transactions Log */}
      {activeTab === 'transactions' && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Supplier / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3 px-4 text-cream-300">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-cream-100">
                      {t.ingredient?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.type === 'PURCHASE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cream-100">
                      {Number(t.quantity)} {t.ingredient?.unit}
                    </td>
                    <td className="py-3 px-4 text-cream-200">
                      {t.totalCost ? `${currency}${Number(t.totalCost).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-cream-400">
                      {t.supplier?.name || t.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Stock Transaction Modal */}
      <Modal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        title="Record Stock Movement (In / Out)"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Ingredient *</label>
            <select
              value={txnForm.ingredientId}
              onChange={(e) => setTxnForm({ ...txnForm, ingredientId: e.target.value })}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Current: {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Transaction Type *</label>
              <select
                value={txnForm.type}
                onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              >
                <option value="PURCHASE">Purchase (Stock IN)</option>
                <option value="USAGE">Kitchen Usage (Stock OUT)</option>
                <option value="SPOILAGE">Spoilage (Stock OUT)</option>
                <option value="ADJUSTMENT">Stock Audit Count</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                required
                value={txnForm.quantity}
                onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {txnForm.type === 'PURCHASE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cream-300 mb-1">Supplier</label>
                <select
                  value={txnForm.supplierId}
                  onChange={(e) => setTxnForm({ ...txnForm, supplierId: e.target.value })}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                >
                  <option value="">Choose Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cream-300 mb-1">Unit Cost ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={txnForm.unitCost}
                  onChange={(e) => setTxnForm({ ...txnForm, unitCost: e.target.value })}
                  placeholder="e.g. 25.00"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Notes</label>
            <input
              type="text"
              value={txnForm.notes}
              onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })}
              placeholder="Invoice # or prep note..."
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
            />
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsTxnModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              Record Movement
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Ingredient Modal */}
      <Modal
        isOpen={isIngModalOpen}
        onClose={() => setIsIngModalOpen(false)}
        title="Add Raw Ingredient"
      >
        <form onSubmit={handleSaveIngredient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Ingredient Name *</label>
            <input
              type="text"
              required
              value={ingForm.name}
              onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
              placeholder="e.g. Valrhona 70% Dark Chocolate"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Category *</label>
              <select
                value={ingForm.category}
                onChange={(e) => setIngForm({ ...ingForm, category: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Unit of Measurement *</label>
              <select
                value={ingForm.unit}
                onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Initial Stock</label>
              <input
                type="number"
                step="0.01"
                value={ingForm.currentStock}
                onChange={(e) => setIngForm({ ...ingForm, currentStock: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Alert Threshold</label>
              <input
                type="number"
                step="0.01"
                value={ingForm.minThreshold}
                onChange={(e) => setIngForm({ ...ingForm, minThreshold: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Unit Cost ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={ingForm.unitCost}
                onChange={(e) => setIngForm({ ...ingForm, unitCost: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsIngModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              Add to Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isSupModalOpen}
        onClose={() => setIsSupModalOpen(false)}
        title="Add Vendor / Supplier"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Supplier Company Name *</label>
            <input
              type="text"
              required
              value={supForm.name}
              onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
              placeholder="e.g. Imperial Meats & Seafood"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Contact Representative</label>
              <input
                type="text"
                value={supForm.contactPerson}
                onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={supForm.phone}
                onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Supplied Ingredients / Lines</label>
            <input
              type="text"
              value={supForm.suppliedItems}
              onChange={(e) => setSupForm({ ...supForm, suppliedItems: e.target.value })}
              placeholder="Produce, Dairy, Cheeses..."
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
            />
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSupModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              Save Vendor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
