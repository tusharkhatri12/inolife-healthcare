import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { coverageService } from '../services/coverageService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CoverageForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // When navigating from CoverageDashboard, we can pass an existing plan via location.state
  const existingPlan = location.state?.plan || null;
  const isEditMode = Boolean(existingPlan?._id);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    doctorId: existingPlan?.doctorId?._id || '',
    month:
      existingPlan?.month ||
      format(new Date(), 'yyyy-MM'),
    plannedVisits: existingPlan?.plannedVisits?.toString() || '',
  });
  const [assignedMRLabel, setAssignedMRLabel] = useState(
    existingPlan?.assignedMR
      ? `${existingPlan.assignedMR.name} (${existingPlan.assignedMR.employeeId || 'N/A'})`
      : ''
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (!isEditMode && form.doctorId && doctors.length > 0) {
      const selected = doctors.find((d) => d._id === form.doctorId);
      if (selected?.assignedMR) {
        setAssignedMRLabel(
          `${selected.assignedMR.name} (${selected.assignedMR.employeeId || 'N/A'})`
        );
      } else {
        setAssignedMRLabel('No MR assigned');
      }
    }
  }, [form.doctorId, doctors, isEditMode]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await doctorService.getDoctors({ isActive: true });
      const doctorsList = response.data?.doctors || [];
      setDoctors(doctorsList);

      // If creating and only one doctor, pre-select
      if (!isEditMode && !form.doctorId && doctorsList.length === 1) {
        const doc = doctorsList[0];
        setForm((prev) => ({ ...prev, doctorId: doc._id }));
        if (doc.assignedMR) {
          setAssignedMRLabel(
            `${doc.assignedMR.name} (${doc.assignedMR.employeeId || 'N/A'})`
          );
        }
      }
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.doctorId && !isEditMode) {
      newErrors.doctorId = 'Doctor is required';
    }

    if (!form.month) {
      newErrors.month = 'Month is required';
    }

    if (form.plannedVisits === '' || form.plannedVisits === null) {
      newErrors.plannedVisits = 'Planned visits is required';
    } else {
      const num = Number(form.plannedVisits);
      if (Number.isNaN(num) || num < 0) {
        newErrors.plannedVisits = 'Planned visits must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        month: form.month,
        plannedVisits: Number(form.plannedVisits),
      };

      if (!isEditMode) {
        payload.doctorId = form.doctorId;
      }

      if (isEditMode) {
        await coverageService.updateCoveragePlan(existingPlan._id, {
          plannedVisits: payload.plannedVisits,
        });
        toast.success('Coverage plan updated successfully');
      } else {
        await coverageService.createCoveragePlan(payload);
        toast.success('Coverage plan created successfully');
      }

      navigate('/coverage');
    } catch (error) {
      console.error('Error saving coverage plan:', error);
      const msg =
        error.response?.data?.message ||
        (isEditMode ? 'Failed to update coverage plan' : 'Failed to create coverage plan');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor =
    isEditMode && existingPlan?.doctorId
      ? existingPlan.doctorId
      : doctors.find((d) => d._id === form.doctorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Coverage Plan' : 'Create Coverage Plan'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode
            ? 'Update planned visits for the selected doctor and month.'
            : 'Define monthly visit targets for a doctor.'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor selection (read-only in edit mode) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            {isEditMode ? (
              <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">
                  {existingPlan.doctorId?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {existingPlan.doctorId?.specialization || ''}
                  {existingPlan.doctorId?.city && ` • ${existingPlan.doctorId.city}`}
                </div>
              </div>
            ) : (
              <>
                <select
                  name="doctorId"
                  value={form.doctorId}
                  onChange={handleChange}
                  disabled={loadingDoctors}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.doctorId ? 'border-red-500' : 'border-gray-300'
                  }`}
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
              </>
            )}
          </div>

          {/* Assigned MR (auto-loaded / read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned MR
            </label>
            <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
              {isEditMode
                ? existingPlan.assignedMR
                  ? `${existingPlan.assignedMR.name} (${existingPlan.assignedMR.employeeId || 'N/A'})`
                  : 'No MR assigned'
                : selectedDoctor?.assignedMR
                ? `${selectedDoctor.assignedMR.name} (${selectedDoctor.assignedMR.employeeId || 'N/A'})`
                : assignedMRLabel || 'Select a doctor to view assigned MR'}
            </div>
          </div>

          {/* Month picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <input
              type="month"
              name="month"
              value={form.month}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.month ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.month && (
              <p className="mt-1 text-xs text-red-600">{errors.month}</p>
            )}
          </div>

          {/* Planned visits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Visits
            </label>
            <input
              type="number"
              name="plannedVisits"
              min="0"
              value={form.plannedVisits}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.plannedVisits ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.plannedVisits && (
              <p className="mt-1 text-xs text-red-600">{errors.plannedVisits}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/coverage')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
            >
              {submitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Saving...'
                : isEditMode
                ? 'Update Plan'
                : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoverageForm;

