import React from 'react';
import { Printer, X, CheckCircle, Receipt } from 'lucide-react';

export default function PrintBillModal({ isOpen, onClose, invoice, restaurantInfo }) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = restaurantInfo?.currencySymbol || '$';
  const order = invoice.order || {};
  const items = order.orderItems || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-charcoal-900 border border-charcoal-700 rounded-2xl shadow-2xl p-6 text-cream-100">
        {/* Controls - Hidden on print */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800 print:hidden">
          <div className="flex items-center space-x-2 text-brand-gold">
            <Receipt className="w-5 h-5" />
            <h3 className="font-serif font-bold text-base text-cream-50">Invoice Receipt</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-semibold shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-cream-400 hover:text-white hover:bg-charcoal-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="p-4 sm:p-6 bg-cream-50 text-charcoal-950 rounded-xl my-3 font-mono text-xs shadow-inner">
          {/* Restaurant Header */}
          <div className="text-center pb-3 border-b border-dashed border-charcoal-300">
            <h2 className="font-serif font-bold text-base text-charcoal-950 uppercase tracking-wider">
              {restaurantInfo?.restaurantName || 'Telangana Ruchulu'}
            </h2>
            <p className="text-[10px] text-gray-600 italic">
              {restaurantInfo?.tagline || 'Kakatiya Military Kitchen & Royal Biryanis'}
            </p>
            <p className="text-[10px] text-gray-700 mt-1">
              {restaurantInfo?.address || 'Plot 108, Hitec City Main Road, Madhapur, Hyderabad'}
            </p>
            <p className="text-[10px] text-gray-700">
              Tel: {restaurantInfo?.phone || '+91 98480 22338'}
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 border-b border-dashed border-charcoal-300 space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order:</span>
              <span className="font-bold">{order.orderNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Table:</span>
              <span>{order.table?.tableNumber || 'Takeaway'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guest:</span>
              <span>{invoice.customerName || 'Walk-in Guest'}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-2.5 border-b border-dashed border-charcoal-300">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-gray-300 pb-1 text-gray-600 uppercase text-[9px]">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-1 font-sans text-xs font-medium text-gray-900 pr-1">
                      {it.menuItem?.name || `Item #${it.menuItemId}`}
                    </td>
                    <td className="py-1 text-center">{it.quantity}</td>
                    <td className="py-1 text-right">{currency}{Number(it.unitPrice).toFixed(2)}</td>
                    <td className="py-1 text-right font-semibold">{currency}{Number(it.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="py-2.5 border-b border-dashed border-charcoal-300 space-y-1 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>{currency}{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax / GST ({Number(invoice.taxRate)}%):</span>
              <span>{currency}{Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount:</span>
                <span>-{currency}{Number(invoice.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-300 text-charcoal-950">
              <span>TOTAL AMOUNT:</span>
              <span>{currency}{Number(invoice.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status & Footer */}
          <div className="pt-3 text-center space-y-1">
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Status: {invoice.paymentStatus}</span>
            </div>
            <p className="text-[10px] text-gray-600 pt-2 italic">
              {restaurantInfo?.invoiceFooter || 'Thank you for dining with us! Please visit again.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
