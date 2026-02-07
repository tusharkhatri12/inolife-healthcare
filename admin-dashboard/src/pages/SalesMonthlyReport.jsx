import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { salesService } from '../services/salesService';
import { FiDollarSign, FiList, FiBarChart2 } from 'react-icons/fi';

const SalesMonthlyReport = () => {
  const [filters, setFilters] = useState({
    saleMonthStart: format(subMonths(new Date(), 12), 'yyyy-MM'),
    saleMonthEnd: format(new Date(), 'yyyy-MM'),
  });
  const [data, setData] = useState({
    monthlyPrimary: [],
    monthlySecondary: [],
    stockistMonthly: [],
    mrMonthlySecondary: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.saleMonthStart) params.saleMonthStart = filters.saleMonthStart;
      if (filters.saleMonthEnd) params.saleMonthEnd = filters.saleMonthEnd;
      const res = await salesService.getMonthlySalesReport(params);
      setData({
        monthlyPrimary: res.data?.monthlyPrimary || [],
        monthlySecondary: res.data?.monthlySecondary || [],
        stockistMonthly: res.data?.stockistMonthly || [],
        mrMonthlySecondary: res.data?.mrMonthlySecondary || [],
      });
    } catch (e) {
      console.error('Error loading monthly report', e);
      setData({
        monthlyPrimary: [],
        monthlySecondary: [],
        stockistMonthly: [],
        mrMonthlySecondary: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monthly Sales Report</h1>
          <p className="text-gray-600 mt-2">
            Primary &amp; Secondary sales by month (MR + Admin combined). Simple tables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/sales" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${location.pathname === '/sales' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><FiList size={16} /> List</Link>
          <Link to="/sales/overview" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${location.pathname === '/sales/overview' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><FiBarChart2 size={16} /> Overview</Link>
          <Link to="/sales/monthly" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${location.pathname === '/sales/monthly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><FiDollarSign size={16} /> Monthly report</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Month range</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="month"
              value={filters.saleMonthStart}
              onChange={(e) => setFilters({ ...filters, saleMonthStart: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="month"
              value={filters.saleMonthEnd}
              onChange={(e) => setFilters({ ...filters, saleMonthEnd: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiDollarSign /> Monthly Primary Sales (value)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.monthlyPrimary.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                    ) : (
                      data.monthlyPrimary.map((row) => (
                        <tr key={row.month}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.month}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            ₹{Number(row.value).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiDollarSign /> Monthly Secondary Sales (value)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.monthlySecondary.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                    ) : (
                      data.monthlySecondary.map((row) => (
                        <tr key={row.month}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.month}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            ₹{Number(row.value).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Stockist-wise monthly totals</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stockist</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.stockistMonthly.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                  ) : (
                    data.stockistMonthly.flatMap((m) =>
                      (m.stockists || []).map((s) => (
                        <tr key={`${m.month}-${s.stockistId}`}>
                          <td className="px-4 py-2 text-sm text-gray-900">{m.month}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.name}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            ₹{Number(s.total).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">MR-wise monthly secondary totals</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MR</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.mrMonthlySecondary.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                  ) : (
                    data.mrMonthlySecondary.flatMap((m) =>
                      (m.mrs || []).map((mr) => (
                        <tr key={`${m.month}-${mr.mrId}`}>
                          <td className="px-4 py-2 text-sm text-gray-900">{m.month}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{mr.name}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            ₹{Number(mr.total).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesMonthlyReport;
