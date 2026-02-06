import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { coverageService } from '../services/coverageService';
import '../styles/coverageList.css';

const CoverageList = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await coverageService.getAdminCoverageSummary({ month });
      const data =
        res?.data?.results ||
        res?.data?.plans ||
        res?.results ||
        res?.plans ||
        [];

      setRows(data);
    } catch (err) {
      console.error('Error loading coverage summary:', err);
      setError(
        err?.response?.data?.message ||
          'Failed to load coverage summary. Please try again.'
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const getStatusClass = (status) => {
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

  const getStatusLabel = (status) => {
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

  const handleEdit = (row) => {
    // This page only lists; editing is handled via CoverageForm
    // Navigate from parent (e.g. via Link) with location.state if needed.
    // Here we just log to console as a placeholder.
    console.log('Edit coverage plan:', row);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Coverage List</h1>
        <p className="text-gray-600 mt-2">
          Detailed list of doctor coverage plans for the selected month.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="md:ml-auto">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Coverage Plans - {format(new Date(month + '-01'), 'MMMM yyyy')}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="coverage-list-table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MR Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planned Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No coverage plans found for this month.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const doctor = row.doctor || row.doctorId || {};
                    const mr = row.mr || row.assignedMR || {};
                    const planned =
                      row.plannedVisits ??
                      row.totalPlanned ??
                      0;
                    const actual =
                      row.actualVisits ??
                      row.totalActual ??
                      0;
                    const compliance =
                      row.compliancePercentage ??
                      row.avgCompliance ??
                      (planned > 0 ? (actual / planned) * 100 : 0);
                    const status = row.status || null;

                    return (
                      <tr key={row._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {doctor.specialization || ''}
                            {doctor.city && ` • ${doctor.city}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {mr.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {mr.employeeId || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {planned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {actual}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(compliance || 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`status-badge ${getStatusClass(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="text-primary hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverageList;

