import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { doctorService } from '../services/doctorService';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiEdit2 } from 'react-icons/fi';

const PendingDoctorApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await doctorService.getDoctors({
        isApproved: 'false',
        isActive: 'true',
      });
      setDoctors(res?.data?.doctors || []);
    } catch (err) {
      console.error('Error loading pending doctors:', err);
      setError(err?.response?.data?.message || 'Failed to load pending doctors.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (doctor) => {
    try {
      setActionLoading(doctor._id);
      await doctorService.updateDoctor(doctor._id, { isApproved: true });
      toast.success(`${doctor.name} approved.`);
      setEditModal(null);
      loadPending();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctor) => {
    if (!window.confirm(`Reject "${doctor.name}"? They will be marked inactive.`)) return;
    try {
      setActionLoading(doctor._id);
      await doctorService.updateDoctor(doctor._id, { isActive: false });
      toast.success(`${doctor.name} rejected (inactive).`);
      setEditModal(null);
      loadPending();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSave = async () => {
    if (!editModal?.doctor) return;
    const d = editModal.doctor;
    const payload = {
      name: editModal.form.name,
      specialization: editModal.form.specialization,
      clinicName: editModal.form.clinicName,
      area: editModal.form.area,
      city: editModal.form.city,
      phone: editModal.form.phone,
    };
    try {
      setActionLoading(d._id);
      await doctorService.updateDoctor(d._id, payload);
      toast.success('Details updated.');
      setEditModal(null);
      loadPending();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update.');
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (doctor) => {
    setEditModal({
      doctor,
      form: {
        name: doctor.name || '',
        specialization: doctor.specialization || '',
        clinicName: doctor.clinicName || '',
        area: doctor.area || '',
        city: doctor.city || '',
        phone: doctor.phone || '',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Pending Doctor Approvals</h1>
        <p className="text-gray-600 mt-2">
          Doctors added by MRs. Approve, edit details, or reject.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={loadPending}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No pending approvals.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area / City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By (MR)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctors.map((doc) => (
                  <tr key={doc._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.specialization || '–'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {[doc.area, doc.city].filter(Boolean).join(' / ') || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.assignedMR?.name || '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.createdAt ? format(new Date(doc.createdAt), 'dd MMM yyyy') : '–'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEdit(doc)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleApprove(doc)}
                        disabled={actionLoading === doc._id}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                        title="Approve"
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleReject(doc)}
                        disabled={actionLoading === doc._id}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                        title="Reject"
                      >
                        <FiX size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Edit doctor details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={editModal.form.name}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                <input
                  value={editModal.form.specialization}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, specialization: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital</label>
                <input
                  value={editModal.form.clinicName}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, clinicName: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area/Locality</label>
                <input
                  value={editModal.form.area}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, area: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  value={editModal.form.city}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, city: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={editModal.form.phone}
                  onChange={(e) => setEditModal((m) => ({ ...m, form: { ...m.form, phone: e.target.value } }))}
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
                disabled={actionLoading === editModal.doctor._id || !editModal.form.name || !editModal.form.specialization}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => handleApprove(editModal.doctor)}
                disabled={actionLoading === editModal.doctor._id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDoctorApprovals;
