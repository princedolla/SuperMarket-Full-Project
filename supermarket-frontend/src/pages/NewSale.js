import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiPrinter } from 'react-icons/fi';

const NewSale = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const searchRef = useRef(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    if (search) {
      API.get(`/products?search=${search}`).then((res) => setProducts(res.data)).catch(() => {});
    } else {
      setProducts([]);
    }
  }, [search]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearch('');
    setProducts([]);
    searchRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null : { ...item, quantity: newQty };
      }).filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const change = amountPaid ? parseFloat(amountPaid) - subtotal : 0;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (parseFloat(amountPaid) < subtotal) {
      alert('Amount paid must be at least the total');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/sales', {
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid),
      });
      setSuccess({ saleId: res.data.id, change: res.data.change_amount, items: [...cart] });
      setCart([]);
      setAmountPaid('');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Receipt #${success.saleId}</title>
      <style>
        body { font-family: monospace; font-size: 14px; width: 300px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 4px 0; color: #666; }
        .line { border-top: 1px dashed #333; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 4px 0; }
        th { border-bottom: 1px solid #333; }
        .right { text-align: right; }
        .total { font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
      </style></head><body>
        <div class="header">
          <h1>SuperMarket</h1>
          <p>Management System</p>
          <p>Sale #${success.saleId}</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="line"></div>
        <table>
          <tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
          ${success.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">FRW ${Number(item.selling_price).toFixed(2)}</td>
              <td class="right">$${(item.selling_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line"></div>
        <table>
          <tr><td>Payment: ${paymentMethod}</td><td class="right total">Total: FRW ${subtotal.toFixed(2)}</td></tr>
          <tr><td>Paid: FRW ${parseFloat(amountPaid).toFixed(2)}</td><td class="right">Change: FRW ${Number(success.change).toFixed(2)}</td></tr>
        </table>
        <div class="footer">Thank you for your purchase!</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      <div className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          New Sale
        </h1>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-3 text-emerald-400" />
          <input
            ref={searchRef}
            type="text" placeholder="Search products by name or barcode..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
          />
          {products.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-emerald-100 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto mt-1 animate-fadeIn">
              {products.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex justify-between items-center border-b border-emerald-50 transition-colors">
                  <div>
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-400 text-sm ml-2">{p.barcode}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">FRW ${Number(p.selling_price).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Stock: {p.quantity}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fadeIn">
              <FiShoppingBag size={64} className="mb-4 text-emerald-200" />
              <p className="text-lg">Search and select products to add to cart</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-emerald-50 sticky top-0">
                <tr className="text-left text-emerald-700">
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Total</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.id} className="border-t border-emerald-50 hover:bg-emerald-50/50 transition-colors animate-slideIn" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 text-gray-600">FRW ${Number(item.selling_price).toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"><FiMinus size={14} /></button>
                        <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"><FiPlus size={14} /></button>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">${(item.selling_price * item.quantity).toFixed(2)}</td>
                    <td className="p-4">
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="w-80 bg-gradient-to-b from-white to-emerald-50 rounded-xl shadow-sm p-6 flex flex-col border border-emerald-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>

        <div className="flex-1">
          <div className="text-4xl font-bold text-emerald-600 mb-6 animate-fadeIn">FRW ${subtotal.toFixed(2)}</div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Money</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
            <input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              placeholder="0.00" />
          </div>

          <div className="border-t border-emerald-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">FRW ${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Change</span>
              <span className={`font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                FRW ${Math.max(0, change).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || loading || !amountPaid}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all mt-4 animate-pulse disabled:animate-none shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Processing...
            </span>
          ) : `Complete Sale (${itemCount} items)`}
        </button>
      </div>

      {success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 animate-slideUp shadow-2xl" ref={receiptRef}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Sale Complete!</h2>
              <p className="text-emerald-600 font-medium mt-1">Sale #{success.saleId}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              {success.items?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${(item.selling_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between text-base font-bold text-gray-800">
                <span>Total</span>
                <span>FRW ${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Change</span>
                <span>FRW ${Number(success.change).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={printReceipt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                <FiPrinter /> Print
              </button>
              <button onClick={() => setSuccess(null)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
