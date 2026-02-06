import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiUsers,
  FiActivity,
  FiPackage,
  FiUpload,
  FiMap,
  FiLogOut,
  FiMenu,
  FiX,
  FiTarget,
  FiUserCheck,
  FiDollarSign,
  FiTag,
} from 'react-icons/fi';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/mr-performance', label: 'MR Performance', icon: FiUsers },
    { path: '/doctor-analytics', label: 'Doctor Analytics', icon: FiActivity },
    { path: '/pending-doctor-approvals', label: 'Pending Doctor Approvals', icon: FiUserCheck },
    { path: '/product-analytics', label: 'Product Analytics', icon: FiPackage },
    { path: '/coverage', label: 'Coverage Planning', icon: FiTarget },
    { path: '/mr-users', label: 'MR Users', icon: FiUsers },
    ...(user?.role === 'Owner' ? [{ path: '/mr-tracking', label: 'MR Tracking Map', icon: FiMap }] : []),
    { path: '/csv-upload', label: 'CSV Upload', icon: FiUpload },
    { path: '/sales', label: 'Sales', icon: FiDollarSign },
    { path: '/stockists', label: 'Stockists', icon: FiPackage },
    { path: '/schemes', label: 'Schemes', icon: FiTag },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className={`font-bold text-xl text-primary ${!sidebarOpen && 'hidden'}`}>
            INOLIFE
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className={`mb-4 ${!sidebarOpen && 'hidden'}`}>
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
