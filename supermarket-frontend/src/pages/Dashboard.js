import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { FiPackage, FiList, FiTruck, FiShoppingCart, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/dashboard').then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  const cards = [
    { label: 'Total Products', value: data.totalProducts, icon: FiPackage, color: 'bg-blue-500' },
    { label: 'Categories', value: data.totalCategories, icon: FiList, color: 'bg-green-500' },
    { label: 'Suppliers', value: data.totalSuppliers, icon: FiTruck, color: 'bg-purple-500' },
    { label: 'Total Sales', value: data.totalSales, icon: FiShoppingCart, color: 'bg-orange-500' },
    { label: 'Total Revenue', value: `FRW ${Number(data.totalRevenue).toFixed(2)}`, icon: FiDollarSign, color: 'bg-emerald-500' },
    { label: 'Today Sales', value: `FRW ${Number(data.todaySales).toFixed(2)}`, icon: FiDollarSign, color: 'bg-teal-500' },
    { label: 'Low Stock Items', value: data.lowStockCount, icon: FiAlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-lg text-white`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Sales</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">#</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Cashier</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100">
                  <td className="py-2">{sale.id}</td>
                  <td className="py-2 font-medium">FRW ${Number(sale.total_amount).toFixed(2)}</td>
                  <td className="py-2">{sale.cashier_name || 'N/A'}</td>
                  <td className="py-2 text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.recentSales.length === 0 && (
                <tr><td colSpan="4" className="py-4 text-center text-gray-400">No sales yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">Quantity</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100">
                  <td className="py-2">{product.name}</td>
                  <td className="py-2">{product.quantity}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.lowStockProducts.length === 0 && (
                <tr><td colSpan="3" className="py-4 text-center text-gray-400">All products well stocked</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
