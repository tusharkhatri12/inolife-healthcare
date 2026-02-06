import React, { useEffect, useState } from 'react';
import { doctorService } from '../services/doctorService';
import { coverageService } from '../services/coverageService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CreateCoveragePlan = ({ onSuccess, onCancel }) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    month: format(new Date(), 'yyyy-MM'),
    doctorId: '',
    plannedVisits: '',
  });
  const [assignedMR, setAssignedMR] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (form.doctorId && doctors.length > 0) {
      const selected = doctors.find((d) => d._id === form.doctorId);
      if (selected?.assignedMR) {
        setAssignedMR(selected.assignedMR);
      } else {
        setAssignedMR(null);
      }
    } else {
      setAssignedMR(null);
    }
  }, [form.doctorId, doctors]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await doctorService.getDoctors({ isActive: true });
      const doctorsList = response.data?.doctors || [];
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.month) {
      newErrors.month = 'Month is required';
    }

    if (!form.doctorId) {
      newErrors.doctorId = 'Doctor is required';
    }

    if (form.plannedVisits === '' || form.plannedVisits === null) {
      newErrors.plannedVisits = 'Planned visits is required';
    } else {
      const num = Number(form.plannedVisits);
      if (Number.isNaN(num) || num < 1) {
        newErrors.plannedVisits = 'Planned visits must be at least 1';
      }
    }

    if (!assignedMR) {
      newErrors.assignedMR = 'Selected doctor must have an assigned MR';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        month: form.month,
        doctorId: form.doctorId,
        plannedVisits: Number(form.plannedVisits),
      };

      await coverageService.createAdminCoveragePlan(payload);
      
      toast.success('Coverage plan created successfully');
      
      // Reset form
      setForm({
        month: format(new Date(), 'yyyy-MM'),
        doctorId: '',
        plannedVisits: '',
      });
      setAssignedMR(null);
      setErrors({});
      setApiError('');

      // Call success callback to refresh list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating coverage plan:', error);
      
      const errorMessage =
        error.response?.data?.message || 'Failed to create coverage plan';
      
      // Check for duplicate error
      if (
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('already exists')
      ) {
        setApiError(
          `A coverage plan already exists for this doctor and month (${format(
            new Date(form.month + '-01'),
            'MMMM yyyy'
          )}). Please select a different month or doctor.`
        );
      } else {
        setApiError(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Create Coverage Plan
      </h2>

      {apiError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">Error</p>
          <p className="text-sm text-red-600 mt-1">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Month selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Month <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            name="month"
            value={form.month}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.month ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.month && (
            <p className="mt-1 text-xs text-red-600">{errors.month}</p>
          )}
        </div>

        {/* Doctor selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            name="doctorId"
            value={form.doctorId}
            onChange={handleChange}
            disabled={loadingDoctors}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.doctorId ? 'border-red-500' : 'border-gray-300'
            } ${loadingDoctors ? 'bg-gray-100' : ''}`}
          >
            <option value="">Select doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialization} ({doctor.city})
              </option>
            ))}
          </select>
          {errors.doctorId && (
            <p className="mt-1 text-xs text-red-600">{errors.doctorId}</p>
          )}
        </div>

        {/* Assigned MR (auto-fetched, read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned MR
          </label>
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
            {assignedMR ? (
              <div>
                <span className="font-medium">
                  {assignedMR.name} ({assignedMR.employeeId || 'N/A'})
                </span>
              </div>
            ) : (
              <span className="text-gray-500">
                {form.doctorId
                  ? 'No MR assigned to this doctor'
                  : 'Select a doctor to view assigned MR'}
              </span>
            )}
          </div>
          {errors.assignedMR && (
            <p className="mt-1 text-xs text-red-600">{errors.assignedMR}</p>
          )}
        </div>

        {/* Planned visits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Visits <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="plannedVisits"
            min="1"
            value={form.plannedVisits}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.plannedVisits ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter number of planned visits"
          />
          {errors.plannedVisits && (
            <p className="mt-1 text-xs text-red-600">{errors.plannedVisits}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || loadingDoctors}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoveragePlan;
