import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { salesService } from '../services/salesService';
import { visitService } from '../services/visitService';
import { userService } from '../services/userService';
import { doctorService } from '../services/doctorService';
import { stockistService } from '../services/stockistService';
import { FiDollarSign, FiUser, FiPackage, FiTrendingUp, FiX } from 'react-icons/fi';

const TABS = ['doctor', 'stockist', 'mr'];

const SalesOverview = () => {
  const [activeTab, setActiveTab] = useState('doctor');
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    mrId: '',
    stockistId: '',
    doctorId: '',
  });
  const [sales, setSales] = useState([]);
  const [visits, setVisits] = useState([]);
  const [mrs, setMrs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailRow, setDetailRow] = useState(null); // { type: 'doctor'|'stockist'|'mr', id, name }
  const [expandedSaleId, setExpandedSaleId] = useState(null); // product-wise drill-down

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const [mrsRes, doctorsRes, stockistsRes] = await Promise.all([
        userService.getUsers({ role: 'MR', isActive: true }),
        doctorService.getDoctors({ isActive: true }),
        stockistService.getStockists({ isActive: true }),
      ]);
      setMrs(mrsRes.data?.users || []);
      setDoctors(doctorsRes.data?.doctors || []);
      setStockists(stockistsRes.data?.stockists || []);
    } catch (e) {
      console.error('Error loading filter options:', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const start = new Date(filters.startDate).toISOString();
      const end = new Date(filters.endDate).toISOString();
      const params = { startDate: start, endDate: end };
      if (filters.mrId) params.mrId = filters.mrId;
      if (filters.stockistId) params.stockistId = filters.stockistId;
      if (filters.doctorId) params.doctorId = filters.doctorId;

      const [salesRes, visitsRes] = await Promise.all([
        salesService.getSales(params),
        visitService.getVisits({ startDate: start, endDate: end }),
      ]);
      setSales(salesRes.data?.sales || []);
      setVisits(visitsRes.data?.visits || []);
    } catch (e) {
      console.error('Error loading sales data:', e);
      setSales([]);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const doctorStats = useMemo(() => {
    const byDoctor = {};
    sales.forEach((s) => {
      const id = s.doctorId?._id || s.doctorId || 'none';
      if (!byDoctor[id]) {
        byDoctor[id] = {
          doctorId: id,
          name: s.doctorId?.name || 'No doctor',
          totalSales: 0,
          count: 0,
        };
      }
      byDoctor[id].totalSales += s.totalValue || 0;
      byDoctor[id].count += 1;
    });
    const visitCountByDoctor = {};
    visits.forEach((v) => {
      const id = v.doctorId?._id || v.doctorId;
      if (id) visitCountByDoctor[id] = (visitCountByDoctor[id] || 0) + 1;
    });
    return Object.values(byDoctor)
      .map((d) => ({ ...d, visitCount: visitCountByDoctor[d.doctorId] || 0 }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [sales, visits]);

  const stockistStats = useMemo(() => {
    const byStockist = {};
    sales.forEach((s) => {
      const id = s.stockistId?._id || s.stockistId;
      if (!id) return;
      if (!byStockist[id]) {
        byStockist[id] = {
          stockistId: id,
          name: s.stockistId?.name || 'Unknown',
          totalSales: 0,
          count: 0,
        };
      }
      byStockist[id].totalSales += s.totalValue || 0;
      byStockist[id].count += 1;
    });
    return Object.values(byStockist).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales]);

  const mrStats = useMemo(() => {
    const byMr = {};
    sales.forEach((s) => {
      const id = s.mrId?._id || s.mrId;
      if (!id) return;
      if (!byMr[id]) {
        byMr[id] = {
          mrId: id,
          name: s.mrId?.name || 'Unknown',
          totalSales: 0,
          count: 0,
        };
      }
      byMr[id].totalSales += s.totalValue || 0;
      byMr[id].count += 1;
    });
    return Object.values(byMr).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales]);

  const detailEntries = useMemo(() => {
    if (!detailRow) return [];
    if (detailRow.type === 'doctor') {
      return sales.filter((s) => (s.doctorId?._id || s.doctorId) === detailRow.id);
    }
    if (detailRow.type === 'stockist') {
      return sales.filter((s) => (s.stockistId?._id || s.stockistId) === detailRow.id);
    }
    if (detailRow.type === 'mr') {
      return sales.filter((s) => (s.mrId?._id || s.mrId) === detailRow.id);
    }
    return [];
  }, [detailRow, sales]);

  const grandTotal = sales.reduce((sum, s) => sum + (s.totalValue || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Sales Overview</h1>
        <p className="text-gray-600 mt-2">Doctor, stockist & MR-wise sales. Click a row to see entries.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Date range & filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MR</label>
            <select
              value={filters.mrId}
              onChange={(e) => setFilters({ ...filters, mrId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All MRs</option>
              {mrs.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stockist</label>
            <select
              value={filters.stockistId}
              onChange={(e) => setFilters({ ...filters, stockistId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Stockists</option>
              {stockists.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={filters.doctorId}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-green-600" size={24} />
              <span className="text-gray-600">Total Sales (period):</span>
              <span className="text-xl font-bold text-gray-900">₹{Number(grandTotal).toLocaleString()}</span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">{sales.length} sale record(s)</span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex border-b border-gray-200 mb-4">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}-wise
                </button>
              ))}
            </div>

            {activeTab === 'doctor' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">No. of entries</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visit count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {doctorStats.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                    ) : (
                      doctorStats.map((row) => (
                        <tr
                          key={row.doctorId}
                          onClick={() => setDetailRow({ type: 'doctor', id: row.doctorId, name: row.name })}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{Number(row.totalSales).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.count}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.visitCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'stockist' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stockist</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">No. of entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockistStats.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                    ) : (
                      stockistStats.map((row) => (
                        <tr
                          key={row.stockistId}
                          onClick={() => setDetailRow({ type: 'stockist', id: row.stockistId, name: row.name })}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{Number(row.totalSales).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'mr' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MR</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">No. of entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mrStats.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-gray-500 text-sm">No data</td></tr>
                    ) : (
                      mrStats.map((row) => (
                        <tr
                          key={row.mrId}
                          onClick={() => setDetailRow({ type: 'mr', id: row.mrId, name: row.name })}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{Number(row.totalSales).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {detailRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Sales entries – {detailRow.name}</h2>
              <button
                onClick={() => { setDetailRow(null); setExpandedSaleId(null); }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="overflow-auto p-4">
              {detailEntries.length === 0 ? (
                <p className="text-gray-500">No entries</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MR</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total value</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailEntries.map((s) => (
                      <React.Fragment key={s._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2">{s.date ? format(new Date(s.date), 'dd MMM yyyy') : '–'}</td>
                          <td className="px-3 py-2">{s.mrId?.name || '–'}</td>
                          <td className="px-3 py-2">{s.doctorId?.name || '–'}</td>
                          <td className="px-3 py-2 text-right">₹{Number(s.totalValue || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setExpandedSaleId((id) => (id === s._id ? null : s._id)); }}
                              className="text-primary text-xs font-medium hover:underline"
                            >
                              {expandedSaleId === s._id ? 'Hide' : 'View details'}
                            </button>
                          </td>
                        </tr>
                        {expandedSaleId === s._id && (
                          <tr>
                            <td colSpan={5} className="px-3 py-2 bg-gray-50">
                              <div className="text-xs font-medium text-gray-600 mb-1">Product-wise breakdown</div>
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead>
                                  <tr>
                                    <th className="px-2 py-1 text-left text-xs text-gray-500">Product name</th>
                                    <th className="px-2 py-1 text-right text-xs text-gray-500">Qty</th>
                                    <th className="px-2 py-1 text-right text-xs text-gray-500">Free</th>
                                    <th className="px-2 py-1 text-right text-xs text-gray-500">Value (₹)</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {(Array.isArray(s.products) && s.products.length > 0) ? (
                                    s.products.map((p, idx) => (
                                      <tr key={p.productId?._id || idx}>
                                        <td className="px-2 py-1">{p.productName || p.productId?.name || '–'}</td>
                                        <td className="px-2 py-1 text-right">{Number(p.quantity) || 0}</td>
                                        <td className="px-2 py-1 text-right">{Number(p.free) || 0}</td>
                                        <td className="px-2 py-1 text-right">{Number(p.value || 0).toLocaleString()}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr><td colSpan={4} className="px-2 py-1 text-gray-500">No product lines</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOverview;
