import React, { useEffect, useState } from 'react';
import { coverageService } from '../services/coverageService';
import { userService } from '../services/userService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreateCoveragePlan from '../components/CreateCoveragePlan';
import '../styles/coverage.css';

const CoverageDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    month: format(new Date(), 'yyyy-MM'),
    mrId: '',
    status: '',
  });

  useEffect(() => {
    loadMRs();
  }, []);

  useEffect(() => {
    loadCoveragePlans();
  }, [filters]);

  const loadMRs = async () => {
    try {
      const response = await userService.getUsers({ role: 'MR', isActive: true });
      setMrs(response.data?.users || []);
    } catch (error) {
      console.error('Error loading MRs:', error);
      toast.error('Failed to load MRs');
    }
  };

  const loadCoveragePlans = async () => {
    try {
      setLoading(true);
      const params = {
        month: filters.month,
      };
      if (filters.mrId) {
        params.mrId = filters.mrId;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await coverageService.getCoveragePlans(params);
      setPlans(response.data?.plans || []);
    } catch (error) {
      console.error('Error loading coverage plans:', error);
      toast.error('Failed to load coverage plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK':
        return 'status-on-track';
      case 'AT_RISK':
        return 'status-at-risk';
      case 'MISSED':
        return 'status-missed';
      default:
        return '';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ON_TRACK':
        return 'On Track';
      case 'AT_RISK':
        return 'At Risk';
      case 'MISSED':
        return 'Missed';
      default:
        return status || 'N/A';
    }
  };

  const formatMonth = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy');
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadCoveragePlans(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Coverage Planning</h1>
          <p className="text-gray-600 mt-2">Monitor doctor coverage plans and compliance</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New Plan'}
        </button>
      </div>

      {/* Create Coverage Plan Form */}
      {showCreateForm && (
        <CreateCoveragePlan
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MR</label>
            <select
              value={filters.mrId}
              onChange={(e) => setFilters({ ...filters, mrId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All MRs</option>
              {mrs.map((mr) => (
                <option key={mr._id} value={mr._id}>
                  {mr.name} ({mr.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="MISSED">Missed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadCoveragePlans}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Plans</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">{plans.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Planned</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {plans.reduce((sum, p) => sum + (p.plannedVisits || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Actual</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {plans.reduce((sum, p) => sum + (p.actualVisits || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Avg Compliance</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {plans.length > 0
                ? (
                    plans.reduce((sum, p) => sum + (p.compliancePercentage || 0), 0) /
                    plans.length
                  ).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Coverage Plans - {formatMonth(filters.month)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No coverage plans found for the selected filters'}
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.doctorId?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.doctorId?.specialization || ''}
                        {plan.doctorId?.city && ` • ${plan.doctorId.city}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.assignedMR?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.assignedMR?.employeeId || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.plannedVisits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.actualVisits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.compliancePercentage !== undefined
                        ? `${plan.compliancePercentage.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`status-badge ${getStatusColor(plan.status)}`}
                      >
                        {getStatusBadge(plan.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoverageDashboard;
