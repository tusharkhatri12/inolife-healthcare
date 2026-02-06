import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const MRUsers = () => {
  const [mrs, setMRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, mrId: null, name: '' });
  const [form, setForm] = useState({
    name: '',
    username: '',
    territory: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  useEffect(() => {
    loadMRs();
  }, []);

  const loadMRs = async () => {
    try {
      setLoading(true);
      const res = await userService.listMRs();
      setMRs(res.data?.mrs || []);
    } catch (e) {
      console.error('Error loading MRs', e);
      toast.error('Failed to load MRs');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      name: '',
      username: '',
      territory: '',
      password: '',
    });
    setModalOpen(true);
  };

  const handleCreateMR = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      toast.error('Name, mobile, and password are required');
      return;
    }
    setSaving(true);
    try {
      await userService.createMR(form);
      toast.success('MR created');
      setModalOpen(false);
      await loadMRs();
    } catch (e) {
      console.error('Create MR error', e);
      toast.error(e.response?.data?.message || 'Failed to create MR');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this MR? They will not be able to login.')) return;
    try {
      await userService.deactivateMR(id);
      toast.success('MR deactivated');
      await loadMRs();
    } catch (e) {
      console.error('Deactivate MR error', e);
      toast.error(e.response?.data?.message || 'Failed to deactivate MR');
    }
  };

  const openResetModal = (mr) => {
    setResetPassword('');
    setResetModal({ open: true, mrId: mr._id, name: mr.name });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetSaving(true);
    try {
      await userService.resetMRPassword(resetModal.mrId, resetPassword);
      toast.success('Password reset');
      setResetModal({ open: false, mrId: null, name: '' });
    } catch (e) {
      console.error('Reset password error', e);
      toast.error(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Medical Representatives</h1>
          <p className="text-gray-600 mt-2">
            Admin-managed MR accounts. No self-registration.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
        >
          + Add MR
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username (Mobile)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Territory
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : mrs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    No MRs found.
                  </td>
                </tr>
              ) : (
                mrs.map((mr) => (
                  <tr key={mr._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{mr.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mr.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {mr.territory || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          mr.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {mr.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => openResetModal(mr)}
                        className="px-3 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Reset Password
                      </button>
                      {mr.isActive && (
                        <button
                          onClick={() => handleDeactivate(mr._id)}
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Deactivate
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

      {/* Add MR Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New MR</h2>
            <form onSubmit={handleCreateMR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number (Username)
                </label>
                <input
                  type="tel"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Territory / Area
                </label>
                <input
                  type="text"
                  value={form.territory}
                  onChange={(e) => setForm({ ...form, territory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Create MR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              MR: <span className="font-semibold">{resetModal.name}</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, mrId: null, name: '' })}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {resetSaving ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRUsers;

