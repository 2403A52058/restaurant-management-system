import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  Search,
  DollarSign,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PrintBillModal from '../components/PrintBillModal';

export default function Billing() {
  const { settings, hasRole } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [invoices, setInvoices] = useState([]);
  const [unbilledOrders, setUnbilledOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // invoices | history

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [payAmount, setPayAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Generate Invoice Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discountInput, setDiscountInput] = useState(0);

  // Print Bill Modal
  const [printInvoice, setPrintInvoice] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [invRes, ordRes, payRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/orders', { params: { status: 'READY' } }),
        api.get('/billing/payments'),
      ]);

      if (invRes.data?.success) setInvoices(invRes.data.data);
      if (ordRes.data?.success) {
        // filter out orders that already have an invoice
        const unbilled = ordRes.data.data.filter((o) => !o.invoice);
        setUnbilledOrders(unbilled);
        if (unbilled.length > 0 && !selectedOrderId) {
          setSelectedOrderId(unbilled[0].id.toString());
        }
      }
      if (payRes.data?.success) setPayments(payRes.data.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(Number(inv.totalAmount).toFixed(2));
    setTransactionId(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentMethod('CARD');
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/billing/payments', {
        invoiceId: selectedInvoice.id,
        orderId: selectedInvoice.orderId,
        paymentMethod,
        amount: parseFloat(payAmount),
        transactionId,
      });

      if (res.data?.success) {
        setIsPayModalOpen(false);
        fetchBillingData();
        // Prompt for print receipt
        setPrintInvoice({ ...selectedInvoice, paymentStatus: 'PAID' });
        setIsPrintOpen(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing error');
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/billing/generate', {
        orderId: selectedOrderId,
        discountAmount: parseFloat(discountInput) || 0,
      });

      if (res.data?.success) {
        setIsGenModalOpen(false);
        fetchBillingData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invoice generation error');
    }
  };

  const handlePrintClick = (inv) => {
    setPrintInvoice(inv);
    setIsPrintOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Billing, POS & Invoicing
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Checkout desk, multi-tender transactions (Cash, Card, UPI), and print receipts
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchBillingData}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unbilledOrders.length > 0 && (
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-charcoal-950 text-xs font-bold shadow-md shadow-brand-gold/20"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate Invoice ({unbilledOrders.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-3 border-b border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'invoices'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-cream-400 hover:text-white'
          }`}
        >
          Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'history'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-cream-400 hover:text-white'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
      </div>

      {/* Main Content Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-cream-400 text-xs">Loading billing invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
              <p className="text-sm font-serif font-bold text-cream-100">No invoices generated yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Order & Table</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Subtotal / Tax</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-charcoal-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cream-100">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] font-sans text-cream-400 font-normal">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-brand-gold">
                          {inv.order?.table ? inv.order.table.tableNumber : inv.order?.orderType}
                        </span>
                        <span className="block text-[10px] text-cream-400 font-mono">
                          {inv.order?.orderNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-cream-100">
                        {inv.customerName || 'Walk-in Guest'}
                      </td>

                      <td className="py-3.5 px-4 text-cream-300">
                        <div>Sub: {currency}{Number(inv.subtotal).toFixed(2)}</div>
                        <div className="text-[10px] text-cream-400">
                          Tax: {currency}{Number(inv.taxAmount).toFixed(2)} ({Number(inv.taxRate)}%)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-serif font-bold text-sm text-cream-50">
                        {currency}{Number(inv.totalAmount).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{inv.paymentStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {inv.paymentStatus === 'UNPAID' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
                          >
                            Pay Bill
                          </button>
                        )}

                        <button
                          onClick={() => handlePrintClick(inv)}
                          className="p-1.5 rounded-lg text-cream-300 hover:text-brand-gold hover:bg-charcoal-800"
                          title="Print Receipt Bill"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main Content Tab 2: Payments History */}
      {activeTab === 'history' && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Txn Reference</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3.5 px-4 text-cream-200">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cream-100">
                      {p.transactionId || `TXN-${p.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-brand-gold">
                      {p.order?.orderNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-charcoal-800 border border-charcoal-700 font-bold text-[11px] text-cream-100">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-cream-50">
                      {currency}{Number(p.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Settle Invoice: ${selectedInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-charcoal-800 border border-charcoal-700 flex justify-between items-center text-xs">
              <span className="text-cream-300">Amount Due:</span>
              <span className="font-serif font-bold text-lg text-brand-orange">
                {currency}{Number(selectedInvoice.totalAmount).toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-brand-orange/20 border-brand-orange text-brand-orange font-bold'
                      : 'bg-charcoal-800 border-charcoal-700 text-cream-300 hover:text-white'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-brand-orange/20 border-brand-orange text-brand-orange font-bold'
                      : 'bg-charcoal-800 border-charcoal-700 text-cream-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Credit/Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-brand-orange/20 border-brand-orange text-brand-orange font-bold'
                      : 'bg-charcoal-800 border-charcoal-700 text-cream-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">UPI / QR</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Transaction Ref #</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 font-mono"
              />
            </div>

            <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Confirm Payment & Free Table
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        title="Generate Invoice for Order"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Select Order</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            >
              {unbilledOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.table ? `Table ${o.table.tableNumber}` : o.orderType} ({currency}{Number(o.totalAmount).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Special Discount ({currency})</label>
            <input
              type="number"
              step="0.01"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0.00"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsGenModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Bill Receipt Modal */}
      <PrintBillModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        invoice={printInvoice}
        restaurantInfo={settings}
      />
    </div>
  );
}
