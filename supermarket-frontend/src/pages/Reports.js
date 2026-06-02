import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { FiDownload, FiDollarSign, FiShoppingCart, FiTrendingUp, FiPackage } from 'react-icons/fi';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.start = dateFrom;
      if (dateTo) params.end = dateTo;
      if (paymentFilter) params.payment_method = paymentFilter;
      const res = await API.get('/reports/sales', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, paymentFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const exportCSV = () => {
    if (!data?.sales?.length) return;
    const headers = ['ID,Total,Payment,Paid,Change,Cashier,Date'];
    const rows = data.sales.map(s => `"${s.id}","FRW ${Number(s.total_amount).toFixed(2)}","${s.payment_method}","FRW ${Number(s.amount_paid).toFixed(2)}","FRW ${Number(s.change_amount).toFixed(2)}","${s.cashier_name || 'N/A'}","${new Date(s.created_at).toLocaleString()}"`);
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report_${dateFrom}_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    if (!data?.sales?.length) return;
    const XLSX = await import('xlsx');
    const rows = data.sales.map(s => ({
      ID: s.id, Total: Number(s.total_amount).toFixed(2),
      Payment: s.payment_method, Paid: Number(s.amount_paid).toFixed(2),
      Change: Number(s.change_amount).toFixed(2),
      Cashier: s.cashier_name || 'N/A',
      Date: new Date(s.created_at).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report_${dateFrom}_${dateTo}.xlsx`);
  };

  const exportPDF = async () => {
    if (!data?.sales?.length) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text('SuperMarket - Sales Report', 14, 22);
    doc.setFontSize(10); doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
    doc.setFontSize(12); doc.text(`Total Revenue: FRW ${Number(data.totalRevenue).toFixed(2)}`, 14, 44);
    doc.text(`Total Sales: ${data.totalSales}`, 14, 50);
    const rows = data.sales.map(s => [s.id, `FRW ${Number(s.total_amount).toFixed(2)}`, s.payment_method, `FRW ${Number(s.amount_paid).toFixed(2)}`, s.cashier_name || 'N/A', new Date(s.created_at).toLocaleDateString()]);
    doc.autoTable({ head: [['ID', 'Total', 'Payment', 'Paid', 'Cashier', 'Date']], body: rows, startY: 56, styles: { fontSize: 8 }, headStyles: { fillColor: [16, 185, 129] } });
    doc.save(`report_${dateFrom}_${dateTo}.pdf`);
  };

  const maxPayment = data?.paymentBreakdown ? Math.max(...Object.values(data.paymentBreakdown), 1) : 1;

  const cards = data ? [
    { label: 'Total Revenue', value: `FRW ${Number(data.totalRevenue).toFixed(2)}`, icon: FiDollarSign, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Sales', value: data.totalSales, icon: FiShoppingCart, color: 'from-blue-500 to-indigo-600' },
    { label: 'Average Sale', value: `FRW ${Number(data.averageSale).toFixed(2)}`, icon: FiTrendingUp, color: 'from-purple-500 to-pink-600' },
    { label: 'Items Sold', value: data.totalItems || 0, icon: FiPackage, color: 'from-orange-500 to-red-600' },
  ] : [];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Reports</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={!data?.sales?.length} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><FiDownload size={14} /> CSV</button>
          <button onClick={exportExcel} disabled={!data?.sales?.length} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><FiDownload size={14} /> Excel</button>
          <button onClick={exportPDF} disabled={!data?.sales?.length} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><FiDownload size={14} /> PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Payment</label>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm">
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </div>
        <button onClick={loadData} className="self-end px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm font-medium shadow-md">
          Apply
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Loading reports...</div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">Failed to load reports</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, i) => (
              <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 animate-slideUp" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg text-white shadow-lg`}>
                  <card.icon size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Data</h2>
              {data.sales?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-50">
                      <tr className="text-left text-emerald-700">
                        <th className="p-3">#</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Cashier</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.map((s, i) => (
                        <tr key={s.id} className="border-t border-emerald-50 hover:bg-emerald-50/50 transition-colors">
                          <td className="p-3 font-medium">{s.id}</td>
                          <td className="p-3 font-bold text-emerald-700">FRW ${Number(s.total_amount).toFixed(2)}</td>
                          <td className="p-3 capitalize">{s.payment_method}</td>
                          <td className="p-3">FRW ${Number(s.amount_paid).toFixed(2)}</td>
                          <td className="p-3 text-gray-600">{s.cashier_name || 'N/A'}</td>
                          <td className="p-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No sales data for selected period</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Breakdown</h2>
              {data.paymentBreakdown && Object.keys(data.paymentBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(data.paymentBreakdown).map(([method, amount]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700">{method}</span>
                        <span className="font-bold text-gray-800">FRW ${Number(amount).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${
                          method === 'cash' ? 'bg-emerald-500' : method === 'card' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} style={{ width: `${(amount / maxPayment) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No payment data</div>
              )}

              {data.topProducts?.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Top Products</h2>
                  <div className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.product_id || i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700 truncate">{p.product_name}</span>
                            <span className="font-bold text-emerald-700">{p.total_quantity} sold</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${(p.total_quantity / Math.max(...data.topProducts.map(x => x.total_quantity))) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
