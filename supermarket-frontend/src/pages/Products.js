import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [form, setForm] = useState({
    name: '', barcode: '', category_id: '', supplier_id: '',
    quantity: 0, buying_price: '', selling_price: '', description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const params = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const [p, c, s] = await Promise.all([
        API.get('/products', { params }),
        API.get('/categories'),
        API.get('/suppliers')
      ]);
      setProducts(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
    };
    loadData();
  }, [search, catFilter]);

  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({
        name: item.name, barcode: item.barcode || '',
        category_id: item.category_id || '', supplier_id: item.supplier_id || '',
        quantity: item.quantity, buying_price: item.buying_price,
        selling_price: item.selling_price, description: item.description || ''
      });
    } else {
      setEditItem(null);
      setForm({ name: '', barcode: '', category_id: '', supplier_id: '', quantity: 0, buying_price: '', selling_price: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
    };
    try {
      if (editItem) {
        await API.put(`/products/${editItem.id}`, payload);
      } else {
        await API.post('/products', payload);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await API.delete(`/products/${id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Products</h1>
        <button onClick={() => openModal()} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md">
          <FiPlus /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4">
        <input
          type="text" placeholder="Search by name or barcode..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50">
            <tr className="text-left text-emerald-700">
              <th className="p-4">Name</th>
              <th className="p-4">Barcode</th>
              <th className="p-4">Category</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Buy Price</th>
              <th className="p-4">Sell Price</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-emerald-50 hover:bg-emerald-50/50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{p.name}</td>
                <td className="p-4 text-gray-500">{p.barcode || '-'}</td>
                <td className="p-4">{p.category_name || '-'}</td>
                <td className="p-4">{p.supplier_name || '-'}</td>
                <td className="p-4">
                  <span className={`${p.quantity <= 10 ? 'text-red-600 font-bold' : ''}`}>{p.quantity}</span>
                </td>
                <td className="p-4">FRW ${Number(p.buying_price).toFixed(2)}</td>
                <td className="p-4 font-medium text-emerald-600">FRW ${Number(p.selling_price).toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800 transition-colors"><FiEdit2 /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 transition-colors"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="8" className="p-8 text-center text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editItem ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" required value={form.quantity} onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Select</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select value={form.supplier_id} onChange={(e) => setForm({...form, supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Select</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price</label>
                  <input type="number" step="0.01" required value={form.buying_price} onChange={(e) => setForm({...form, buying_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                  <input type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({...form, selling_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" rows="2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all">{editItem ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
