import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiPackage, FiList, FiTruck, FiShoppingCart, FiLogOut, FiUser, FiBarChart2
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { to: '/products', icon: FiPackage, label: 'Products' },
    { to: '/categories', icon: FiList, label: 'Categories' },
    { to: '/suppliers', icon: FiTruck, label: 'Suppliers' },
    { to: '/sales', icon: FiShoppingCart, label: 'Sales' },
    { to: '/new-sale', icon: FiShoppingCart, label: 'New Sale' },
    { to: '/reports', icon: FiBarChart2, label: 'Reports' },
  ];

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">SuperMarket</h1>
        <p className="text-sm text-gray-400">Management System</p>
      </div>

      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <FiUser className="text-gray-400" />
        <span className="text-sm">{user?.full_name || user?.username}</span>
        <span className="ml-auto text-xs bg-emerald-600 px-2 py-0.5 rounded capitalize">{user?.role}</span>
      </div>

      <nav className="flex-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <link.icon />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white w-full transition-all"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
