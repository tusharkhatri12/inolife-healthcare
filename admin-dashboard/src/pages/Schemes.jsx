import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { schemeService } from '../services/schemeService';
import { stockistService } from '../services/stockistService';
import toast from 'react-hot-toast';
import { FiEdit2, FiUserX } from 'react-icons/fi';

const SCHEME_TYPES = ['Discount', 'FreeQty', 'Credit', 'Other'];

const Schemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filters, setFilters] = useState({
    stockistId: '',
    isActive: '',
    schemeType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [editModal, setEditModal] = useState(null); // { scheme, form: { schemeType, description, startDate, endDate } }

  useEffect(() => {
    loadStockists();
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [filters]);

  const loadStockists = async () => {
    try {
      const res = await stockistService.getStockists({});
      setStockists(res?.data?.stockists || []);
    } catch (e) {
      console.error('Error loading stockists:', e);
    }
  };

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.stockistId) params.stockistId = filters.stockistId;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.schemeType) params.schemeType = filters.schemeType;
      const res = await schemeService.getSchemes(params);
      let list = res?.data?.schemes || [];
      if (filters.dateFrom || filters.dateTo) {
        const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : 0;
        const to = filters.dateTo ? new Date(filters.dateTo).getTime() : Infinity;
        list = list.filter((s) => {
          const start = new Date(s.startDate).getTime();
          return start >= from && start <= to;
        });
      }
      setSchemes(list);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load schemes');
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (scheme) => {
    setEditModal({
      scheme,
      form: {
        schemeType: scheme.schemeType || 'Discount',
        description: scheme.description || '',
        startDate: scheme.startDate ? format(new Date(scheme.startDate), 'yyyy-MM-dd') : '',
        endDate: scheme.endDate ? format(new Date(scheme.endDate), 'yyyy-MM-dd') : '',
      },
    });
  };

  const handleEditSave = async () => {
    if (!editModal?.scheme) return;
    try {
      setActionLoading(editModal.scheme._id);
      await schemeService.updateScheme(editModal.scheme._id, {
        schemeType: editModal.form.schemeType,
        description: editModal.form.description || undefined,
        startDate: editModal.form.startDate || undefined,
        endDate: editModal.form.endDate || undefined,
      });
      toast.success('Scheme updated.');
      setEditModal(null);
      loadSchemes();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (scheme) => {
    if (!window.confirm(`Deactivate this scheme? History will be preserved.`)) return;
    try {
      setActionLoading(scheme._id);
      await schemeService.deactivateScheme(scheme._id);
      toast.success('Scheme deactivated.');
      setEditModal(null);
      loadSchemes();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to deactivate.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Schemes</h1>
        <p className="text-gray-600 mt-2">View and manage schemes given to stockists. History is preserved.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.schemeType}
              onChange={(e) => setFilters({ ...filters, schemeType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              {SCHEME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date from</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date to</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSchemes}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : schemes.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No schemes match the filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stockist</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start – End</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schemes.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {s.stockistId?.name || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.schemeType || '–'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {s.description || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.startDate ? format(new Date(s.startDate), 'dd MMM yyyy') : '–'}
                      {s.endDate ? ` – ${format(new Date(s.endDate), 'dd MMM yyyy')}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      {s.isActive && (
                        <button
                          onClick={() => handleDeactivate(s)}
                          disabled={actionLoading === s._id}
                          className="inline-flex items-center px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-60"
                          title="Deactivate"
                        >
                          <FiUserX size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Edit scheme</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editModal.form.schemeType}
                  onChange={(e) =>
                    setEditModal((m) => ({ ...m, form: { ...m.form, schemeType: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {SCHEME_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={editModal.form.description}
                  onChange={(e) =>
                    setEditModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input
                  type="date"
                  value={editModal.form.startDate}
                  onChange={(e) =>
                    setEditModal((m) => ({ ...m, form: { ...m.form, startDate: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                <input
                  type="date"
                  value={editModal.form.endDate}
                  onChange={(e) =>
                    setEditModal((m) => ({ ...m, form: { ...m.form, endDate: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={actionLoading === editModal.scheme._id}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schemes;
