import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { salesService } from '../services/salesService';
import { stockistService } from '../services/stockistService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { FiDollarSign, FiPlus, FiFilter, FiBarChart2, FiList } from 'react-icons/fi';

const SALE_TYPES = [
  { value: 'PRIMARY', label: 'Primary (Company → Stockist)' },
  { value: 'SECONDARY', label: 'Secondary (Stockist → Market)' },
];

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    saleMonthStart: format(subMonths(new Date(), 12), 'yyyy-MM'),
    saleMonthEnd: format(new Date(), 'yyyy-MM'),
    saleType: '',
    stockistId: '',
    mrId: '',
  });
  const [form, setForm] = useState({
    saleType: 'PRIMARY',
    saleMonth: format(new Date(), 'yyyy-MM'),
    stockistId: '',
    mrId: '',
    totalValue: '',
    remarks: '',
  });

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadSales();
  }, [filters]);

  const loadOptions = async () => {
    try {
      const [stockistsRes, mrsRes] = await Promise.all([
        stockistService.getStockists({ isActive: true }),
        userService.listMRs(),
      ]);
      setStockists(stockistsRes.data?.stockists || []);
      setMrs(mrsRes.data?.mrs || []);
    } catch (e) {
      console.error('Error loading options', e);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.saleMonthStart) params.saleMonthStart = filters.saleMonthStart;
      if (filters.saleMonthEnd) params.saleMonthEnd = filters.saleMonthEnd;
      if (filters.saleType) params.saleType = filters.saleType;
      if (filters.stockistId) params.stockistId = filters.stockistId;
      if (filters.mrId) params.mrId = filters.mrId;
      const res = await salesService.getSales(params);
      setSales(res.data?.sales || []);
    } catch (e) {
      console.error('Error loading sales', e);
      toast.error('Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      saleType: 'PRIMARY',
      saleMonth: format(new Date(), 'yyyy-MM'),
      stockistId: '',
      mrId: '',
      totalValue: '',
      remarks: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (sale) => {
    if (sale.createdBy !== 'ADMIN') return;
    setEditingId(sale._id);
    setForm({
      saleType: sale.saleType || 'SECONDARY',
      saleMonth: sale.saleMonth || (sale.date ? format(new Date(sale.date), 'yyyy-MM') : ''),
      stockistId: sale.stockistId?._id || sale.stockistId || '',
      mrId: sale.mrId?._id || sale.mrId || '',
      totalValue: sale.totalValue != null ? String(sale.totalValue) : '',
      remarks: sale.remarks || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.stockistId) {
      toast.error('Stockist is required');
      return;
    }
    const value = Number(form.totalValue);
    if (isNaN(value) || value < 0) {
      toast.error('Total value must be a non-negative number');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        saleType: form.saleType,
        saleMonth: form.saleMonth,
        stockistId: form.stockistId,
        mrId: form.mrId || undefined,
        totalValue: value,
        remarks: form.remarks || undefined,
      };
      if (editingId) {
        await salesService.updateAdminSale(editingId, payload);
        toast.success('Sale updated');
      } else {
        await salesService.createAdminSale(payload);
        toast.success('Sale added');
      }
      setModalOpen(false);
      loadSales();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const effectiveMonth = (sale) =>
    sale.saleMonth || (sale.date ? format(new Date(sale.date), 'yyyy-MM') : '–');

  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-600 mt-2">
            Admin Primary/Secondary sales and MR stockist sales. Add month-wise entries below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/sales"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              location.pathname === '/sales' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiList size={16} /> List
          </Link>
          <Link
            to="/sales/overview"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              location.pathname === '/sales/overview' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiBarChart2 size={16} /> Overview
          </Link>
          <Link
            to="/sales/monthly"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              location.pathname === '/sales/monthly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiDollarSign size={16} /> Monthly report
          </Link>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
        >
          <FiPlus size={18} />
          Add Sale
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiFilter /> Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month from</label>
            <input
              type="month"
              value={filters.saleMonthStart}
              onChange={(e) => setFilters({ ...filters, saleMonthStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month to</label>
            <input
              type="month"
              value={filters.saleMonthEnd}
              onChange={(e) => setFilters({ ...filters, saleMonthEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale type</label>
            <select
              value={filters.saleType}
              onChange={(e) => setFilters({ ...filters, saleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stockist</label>
            <select
              value={filters.stockistId}
              onChange={(e) => setFilters({ ...filters, stockistId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              {stockists.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MR</label>
            <select
              value={filters.mrId}
              onChange={(e) => setFilters({ ...filters, mrId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              {mrs.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stockist</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MR</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created by</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No sales found. Add a sale or adjust filters.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{effectiveMonth(s)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.saleType === 'PRIMARY' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {s.saleType || 'SECONDARY'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.stockistId?.name || '–'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.mrId?.name || '–'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      <FiDollarSign className="inline mr-1" />
                      {Number(s.totalValue || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.createdBy || (s.source === 'ADMIN_ENTRY' ? 'ADMIN' : 'MR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{s.remarks || '–'}</td>
                    <td className="px-4 py-3 text-sm">
                      {s.createdBy === 'ADMIN' && (
                        <button
                          onClick={() => openEditModal(s)}
                          className="text-primary hover:underline text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Sale' : 'Add Sale (Primary / Secondary)'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale type</label>
                <select
                  value={form.saleType}
                  onChange={(e) => setForm({ ...form, saleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {SALE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
                <input
                  type="month"
                  value={form.saleMonth}
                  onChange={(e) => setForm({ ...form, saleMonth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stockist</label>
                <select
                  value={form.stockistId}
                  onChange={(e) => setForm({ ...form, stockistId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select stockist</option>
                  {stockists.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MR (optional)</label>
                <select
                  value={form.mrId}
                  onChange={(e) => setForm({ ...form, mrId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {mrs.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalValue}
                  onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Optional"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
