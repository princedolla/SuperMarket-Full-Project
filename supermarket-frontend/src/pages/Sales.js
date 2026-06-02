import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { FiEye, FiDownload, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ITEMS_PER_PAGE = 10;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await API.get('/sales');
    setSales(res.data);
  };

  const filtered = sales.filter((sale) => {
    const matchSearch = !search || sale.id.toString().includes(search) || (sale.cashier_name || '').toLowerCase().includes(search.toLowerCase());
    const matchPayment = !paymentFilter || sale.payment_method === paymentFilter;
    const saleDate = new Date(sale.created_at);
    const matchFrom = !dateFrom || saleDate >= new Date(dateFrom);
    const matchTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchPayment && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, paymentFilter, dateFrom, dateTo]);

  const viewSale = async (id) => {
    const res = await API.get(`/sales/${id}`);
    setSelectedSale(res.data);
  };

  const paymentBadge = (method) => {
    const styles = {
      cash: 'bg-emerald-100 text-emerald-700',
      card: 'bg-blue-100 text-blue-700',
      mobile: 'bg-purple-100 text-purple-700',
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[method] || 'bg-gray-100 text-gray-700'}`;
  };

  const exportCSV = () => {
    const headers = ['ID,Total,Payment,Paid,Change,Cashier,Date'];
    const rows = filtered.map(s => `"${s.id}","${Number(s.total_amount).toFixed(2)}","${s.payment_method}","${Number(s.amount_paid).toFixed(2)}","${Number(s.change_amount).toFixed(2)}","${s.cashier_name || 'N/A'}","${new Date(s.created_at).toLocaleString()}"`);
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sales_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = filtered.map(s => ({
      ID: s.id, Total: Number(s.total_amount).toFixed(2),
      Payment: s.payment_method, Paid: Number(s.amount_paid).toFixed(2),
      Change: Number(s.change_amount).toFixed(2),
      Cashier: s.cashier_name || 'N/A',
      Date: new Date(s.created_at).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('SuperMarket - Sales Report', 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.setFontSize(10); doc.text(`Total Sales: ${filtered.length}`, 14, 36);
    const rows = filtered.map(s => [s.id, `$${Number(s.total_amount).toFixed(2)}`, s.payment_method, `$${Number(s.amount_paid).toFixed(2)}`, s.cashier_name || 'N/A', new Date(s.created_at).toLocaleDateString()]);
    doc.autoTable({ head: [['ID', 'Total', 'Payment', 'Paid', 'Cashier', 'Date']], body: rows, startY: 40, styles: { fontSize: 8 }, headStyles: { fillColor: [16, 185, 129] } });
    doc.save(`sales_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportSinglePDF = async (sale) => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('SuperMarket - Receipt', 14, 22);
    doc.setFontSize(10);
    doc.text(`Sale #${sale.id}`, 14, 30);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, 14, 36);
    doc.text(`Cashier: ${sale.cashier_name || 'N/A'}`, 14, 42);
    doc.text(`Payment: ${sale.payment_method}`, 14, 48);
    const items = (sale.items || []).map(i => [i.product_name, i.quantity, `FRW ${Number(i.unit_price).toFixed(2)}`, `FRW ${Number(i.total_price).toFixed(2)}`]);
    doc.autoTable({ head: [['Product', 'Qty', 'Price', 'Total']], body: items, startY: 54, styles: { fontSize: 8 }, headStyles: { fillColor: [16, 185, 129] } });
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.text(`Total: FRW ${Number(sale.total_amount).toFixed(2)}`, 14, finalY);
    doc.text(`Paid: FRW ${Number(sale.amount_paid).toFixed(2)}`, 14, finalY + 6);
    doc.text(`Change: FRW ${Number(sale.change_amount).toFixed(2)}`, 14, finalY + 12);
    doc.save(`sale_${sale.id}.pdf`);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Sales History</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"><FiDownload size={14} /> CSV</button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"><FiDownload size={14} /> Excel</button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"><FiDownload size={14} /> PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input type="text" placeholder="Search by ID or cashier..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm">
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile">Mobile Money</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50">
            <tr className="text-left text-emerald-700">
              <th className="p-4">#</th>
              <th className="p-4">Total</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Paid</th>
              <th className="p-4">Change</th>
              <th className="p-4">Cashier</th>
              <th className="p-4">Date</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((sale, i) => (
              <tr key={sale.id} className="border-t border-emerald-50 hover:bg-emerald-50/50 transition-colors animate-slideIn" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="p-4 font-medium text-gray-800">{sale.id}</td>
                <td className="p-4 font-bold text-emerald-700">FRW ${Number(sale.total_amount).toFixed(2)}</td>
                <td className="p-4"><span className={paymentBadge(sale.payment_method)}>{sale.payment_method}</span></td>
                <td className="p-4">FRW ${Number(sale.amount_paid).toFixed(2)}</td>
                <td className="p-4">FRW ${Number(sale.change_amount).toFixed(2)}</td>
                <td className="p-4 text-gray-600">{sale.cashier_name || 'N/A'}</td>
                <td className="p-4 text-gray-500 text-xs">{new Date(sale.created_at).toLocaleString()}</td>
                <td className="p-4">
                  <button onClick={() => viewSale(sale.id)} className="text-blue-600 hover:text-blue-800 transition-colors" title="View details"><FiEye /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="p-8 text-center text-gray-400">No sales found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <FiChevronLeft size={14} /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Next <FiChevronRight size={14} />
          </button>
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-slideUp shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sale #{selectedSale.id}</h2>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 mb-4 text-sm space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(selectedSale.created_at).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Cashier:</span> <span className="font-medium">{selectedSale.cashier_name || 'N/A'}</span></div>
                <div><span className="text-gray-500">Payment:</span> <span className={`${paymentBadge(selectedSale.payment_method)}`}>{selectedSale.payment_method}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold text-emerald-700">FRW ${Number(selectedSale.total_amount).toFixed(2)}</span></div>
                <div><span className="text-gray-500">Paid:</span> ${Number(selectedSale.amount_paid).toFixed(2)}</div>
                <div><span className="text-gray-500">Change:</span> ${Number(selectedSale.change_amount).toFixed(2)}</div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="p-2">Product</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="p-2 font-medium text-gray-700">{item.product_name}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">FRW ${Number(item.unit_price).toFixed(2)}</td>
                    <td className="p-2 font-medium">FRW ${Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-3 mt-4">
              <button onClick={() => exportSinglePDF(selectedSale)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                <FiDownload size={14} /> Export PDF
              </button>
              <button onClick={() => setSelectedSale(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
