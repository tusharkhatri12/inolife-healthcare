import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { visitService } from '../services/visitService';
import { doctorService } from '../services/doctorService';
import { productService } from '../services/productService';
import { userService } from '../services/userService';
import {
  FiUsers,
  FiActivity,
  FiPackage,
  FiTrendingUp,
} from 'react-icons/fi';
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
  LineChart,
  Line,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMRs: 0,
    totalDoctors: 0,
    totalVisits: 0,
    totalProducts: 0,
  });
  const [visitTrend, setVisitTrend] = useState([]);
  const [topMRs, setTopMRs] = useState([]);
  const [fieldActivity, setFieldActivity] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const last7Days = subDays(today, 7);

      // Load stats
      const [mrsRes, doctorsRes, visitsRes, productsRes, leaderboardRes, fieldActivityRes, summaryRes] = await Promise.all([
        userService.getUsers({ role: 'MR', isActive: true }),
        doctorService.getDoctors({ isActive: true }),
        visitService.getVisits({
          startDate: last7Days.toISOString(),
          endDate: today.toISOString(),
        }),
        productService.getProducts({ isActive: true }),
        reportService.getMRLeaderboard({
          startDate: last7Days.toISOString(),
          endDate: today.toISOString(),
          sortBy: 'visits',
        }),
        reportService.getTodaysFieldActivity(),
        reportService.getTodaysVisitSummary(),
      ]);

      setStats({
        totalMRs: mrsRes.data?.users?.length || 0,
        totalDoctors: doctorsRes.data?.doctors?.length || 0,
        totalVisits: visitsRes.data?.visits?.length || 0,
        totalProducts: productsRes.data?.products?.length || 0,
      });

      // Process visit trend
      const visits = visitsRes.data?.visits || [];
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayVisits = visits.filter(
          (v) => format(new Date(v.visitDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        trendData.push({
          date: format(date, 'MMM dd'),
          visits: dayVisits.length,
        });
      }
      setVisitTrend(trendData);

      // Top 5 MRs
      setTopMRs(leaderboardRes.data?.leaderboard?.slice(0, 5) || []);

      // Today's Field Activity
      setFieldActivity(fieldActivityRes.data?.activity || []);
      setTodaySummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total MRs',
      value: stats.totalMRs,
      icon: FiUsers,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: FiActivity,
      color: 'bg-green-500',
    },
    {
      title: 'Total Visits',
      value: stats.totalVisits,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: FiPackage,
      color: 'bg-orange-500',
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your pharma operations</p>
      </div>

      {/* Today's Visit Summary */}
      {todaySummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today&apos;s Visit Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Total Planned</p>
              <p className="text-2xl font-bold text-gray-800">{todaySummary.totalPlanned ?? 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Visits Completed (Met)</p>
              <p className="text-2xl font-bold text-green-700">{todaySummary.visitsMet ?? 0}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Attempted (Not Met)</p>
              <p className="text-2xl font-bold text-amber-700">{todaySummary.visitsNotMet ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Reasons (Not Met)</p>
              <ul className="text-sm text-gray-700 mt-1">
                {todaySummary.reasonsSummary && Object.keys(todaySummary.reasonsSummary).length > 0 ? (
                  Object.entries(todaySummary.reasonsSummary).map(([reason, count]) => (
                    <li key={reason}>{reason}: {count}</li>
                  ))
                ) : (
                  <li>–</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Today's Field Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today&apos;s Field Activity</h2>
        <p className="text-gray-600 text-sm mb-4">
          Active = visit logged or location ping today. Met = doctor met; Not met = attempted visit.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MR Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beat Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Met</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Not Met</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beat %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Common Reason (Not Met)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deviation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fieldActivity.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    No MRs or no data for today.
                  </td>
                </tr>
              ) : (
                fieldActivity.map((row) => {
                  const inactive = !row.active;
                  const deviating = row.deviation > 0;
                  const rowClass = inactive
                    ? 'bg-red-50'
                    : deviating
                    ? 'bg-amber-50'
                    : '';
                  return (
                    <tr key={row.mrId} className={rowClass}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.mrName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            row.active
                              ? 'text-green-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {row.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.beatAssigned ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.doctorsPlanned}</td>
                      <td className="px-4 py-3 text-sm text-green-600">{row.metCount ?? row.doctorsVisited ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-amber-600">{row.notMetCount ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.beatCompletion}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.commonNotMetReason || '–'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.deviation > 0 ? (
                          <span className="text-amber-700" title={row.deviationDoctorNames?.join(', ')}>
                            {row.deviation} planned not visited
                          </span>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-full`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Visit Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#2196F3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top MRs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 MRs (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMRs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mrName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="metrics.totalVisits" fill="#2196F3" name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top MRs Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">MR Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  MR Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Doctors Covered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sales Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topMRs.map((mr, index) => (
                <tr key={mr.mrId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{mr.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mr.mrName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mr.metrics.totalVisits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mr.metrics.uniqueDoctors}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{mr.metrics.totalSalesValue?.toLocaleString() || 0}
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

export default Dashboard;
