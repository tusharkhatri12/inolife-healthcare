import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MRPerformance = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    groupBy: 'day',
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getMRPerformance({
        ...filters,
        startDate: new Date(filters.startDate).toISOString(),
        endDate: new Date(filters.endDate).toISOString(),
      });
      setReports(response.data?.reports || []);
    } catch (error) {
      console.error('Error loading MR performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group data by MR for chart
  const chartData = reports.reduce((acc, report) => {
    const key = report.mrName;
    if (!acc[key]) {
      acc[key] = {
        mrName: key,
        totalVisits: 0,
        doctorsCovered: 0,
        productsPromoted: 0,
      };
    }
    acc[key].totalVisits += report.metrics.totalVisits;
    acc[key].doctorsCovered += report.metrics.doctorsCovered;
    acc[key].productsPromoted += report.metrics.productsPromoted;
    return acc;
  }, {});

  const chartDataArray = Object.values(chartData);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">MR Performance</h1>
        <p className="text-gray-600 mt-2">Track Medical Representative performance metrics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group By
            </label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReports}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Total Visits by MR</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mrName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalVisits" fill="#2196F3" name="Total Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Doctors Covered by MR</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mrName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="doctorsCovered" fill="#4CAF50" name="Doctors Covered" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  MR Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Doctors Covered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Products Promoted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.mrName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.period.day
                      ? `${report.period.day}/${report.period.month}/${report.period.year}`
                      : report.period.week
                      ? `Week ${report.period.week}, ${report.period.year}`
                      : `${report.period.month}/${report.period.year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.metrics.totalVisits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.metrics.doctorsCovered}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.metrics.productsPromoted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MRPerformance;
