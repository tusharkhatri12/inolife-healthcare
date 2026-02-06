import React, { useEffect, useState } from 'react';
import { stockistService } from '../services/stockistService';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiUserX } from 'react-icons/fi';

const Stockists = () => {
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', form: {...}, stockist?: {} }

  const loadStockists = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await stockistService.getStockists({});
      setStockists(res?.data?.stockists || []);
    } catch (err) {
      console.error('Error loading stockists:', err);
      setError(err?.response?.data?.message || 'Failed to load stockists.');
      setStockists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockists();
  }, []);

  const openAdd = () => {
    setModal({
      mode: 'add',
      form: { name: '', area: '', city: '', contactPerson: '', phone: '' },
    });
  };

  const openEdit = (s) => {
    setModal({
      mode: 'edit',
      stockist: s,
      form: {
        name: s.name || '',
        area: s.area || '',
        city: s.city || '',
        contactPerson: s.contactPerson || '',
        phone: s.phone || '',
      },
    });
  };

  const handleSave = async () => {
    if (!modal?.form?.name?.trim()) {
      toast.error('Stockist name is required');
      return;
    }
    try {
      setActionLoading('save');
      if (modal.mode === 'add') {
        await stockistService.createStockist(modal.form);
        toast.success('Stockist added.');
      } else {
        await stockistService.updateStockist(modal.stockist._id, modal.form);
        toast.success('Stockist updated.');
      }
      setModal(null);
      loadStockists();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (s) => {
    if (!window.confirm(`Deactivate "${s.name}"? They will no longer appear in active lists.`)) return;
    try {
      setActionLoading(s._id);
      await stockistService.deactivateStockist(s._id);
      toast.success('Stockist deactivated.');
      setModal(null);
      loadStockists();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stockists</h1>
          <p className="text-gray-600 mt-2">Manage stockists. Only active stockists appear in MR dropdowns.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
        >
          <FiPlus size={18} /> Add Stockist
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={loadStockists}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : stockists.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No stockists. Add one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stockist Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area / City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockists.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {[s.area, s.city].filter(Boolean).join(' / ') || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.contactPerson ? `${s.contactPerson}${s.phone ? `, ${s.phone}` : ''}` : s.phone || '–'}
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

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {modal.mode === 'add' ? 'Add Stockist' : 'Edit Stockist'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={modal.form.name}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Stockist name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality</label>
                <input
                  value={modal.form.area}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, area: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Area or locality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  value={modal.form.city}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, city: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  value={modal.form.contactPerson}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, contactPerson: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={modal.form.phone}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, phone: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading === 'save' || !modal.form.name?.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
              >
                {modal.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stockists;
