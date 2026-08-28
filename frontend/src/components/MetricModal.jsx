import React, { useEffect, useState } from 'react';
import {
  X, TrendingUp, AlertTriangle, CheckCircle, Package, Clock, Truck,
  ShieldAlert, Building, GitCompare, ArrowUpDown, ArrowRight, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const MetricModal = ({ metricType, onClose, initialThroughputTab = 'standard', warehouseId }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [throughputTab, setThroughputTab] = useState(initialThroughputTab); // 'standard' or 'comparison'
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');

  useEffect(() => {
    if (!metricType) return;
    setLoading(true);
    const url = warehouseId 
      ? `/dashboard/drilldown/${metricType}/?warehouse_id=${warehouseId}` 
      : `/dashboard/drilldown/${metricType}/`;

    api.get(url)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Drilldown fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, [metricType, warehouseId]);

  if (!metricType) return null;

  const comparisons = data?.warehouse_comparisons || [];
  const filteredComparisons = selectedWarehouseFilter === 'ALL'
    ? comparisons
    : comparisons.filter((c) => c.warehouse_id === selectedWarehouseFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card bg-stone-900/95 border border-stone-700 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-3 h-8 rounded-full bg-yellow-500 shadow-glow-amber" />
            <div>
              <h2 className="text-xl font-bold text-stone-100 capitalize">
                {metricType === 'inbound' && 'Inbound Freight & Dock Logistics Deep Dive'}
                {metricType === 'outbound' && 'Outbound Dispatches & SLA Performance Analysis'}
                {metricType === 'inventory' && 'Inventory Trajectories & SKU Breach Breakdown'}
                {metricType === 'throughput' && 'Plant Throughput & Warehouse Flow Analysis'}
              </h2>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-yellow-400" />
                <span>Facility: <strong>{data?.warehouse || 'Central Logistics Terminal'}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Throughput Sub-Tab Bar */}
        {metricType === 'throughput' && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-stone-950/80 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThroughputTab('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  throughputTab === 'standard'
                    ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Throughput & Workstations
              </button>
              <button
                onClick={() => setThroughputTab('comparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  throughputTab === 'comparison'
                    ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                    : 'text-stone-400 hover:text-yellow-400 border border-stone-800'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-yellow-400" />
                Compare Inbound vs Outbound
              </button>
            </div>

            {throughputTab === 'comparison' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400 hidden sm:inline">Filter Facility:</span>
                <select
                  value={selectedWarehouseFilter}
                  onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-yellow-400 font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL">All 5 Warehouses (Comparative View)</option>
                  {comparisons.map((c) => (
                    <option key={c.warehouse_id} value={c.warehouse_id}>
                      {c.city} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 text-center text-stone-400">
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Retrieving high-resolution operational telemetry...
            </div>
          ) : data ? (
            <>
              {/* 1. INBOUND DRILLDOWN */}
              {metricType === 'inbound' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Real-Time Dock Load</div>
                      <div className="text-2xl font-black text-yellow-400 mt-1">
                        {data.forecast?.current_dock_load_pct}%
                      </div>
                      <div className="text-xs text-stone-500 mt-1">Threshold alert trigger at 85%</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Active Waiting Queue</div>
                      <div className="text-2xl font-black text-stone-100 mt-1">
                        {data.forecast?.waiting_queue_count} Trucks
                      </div>
                      <div className="text-xs text-stone-500 mt-1">Average wait: 18.5 mins/truck</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">7-Day Projected Inbound</div>
                      <div className="text-2xl font-black text-amber-300 mt-1">
                        {data.forecast?.projected_7day_volume?.toLocaleString()} units
                      </div>
                      <div className="text-xs text-emerald-400 mt-1">{data.forecast?.trend}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                    <h3 className="text-sm font-semibold text-stone-200 mb-3">
                      7-Day Forecast: Inbound Volume vs Dock Load %
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.forecast?.forecast_days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                          <XAxis dataKey="day" stroke="#A8A29E" />
                          <YAxis stroke="#A8A29E" />
                          <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderColor: '#44403C' }} />
                          <Area type="monotone" dataKey="volume" stroke="#EAB308" fill="#EAB308" fillOpacity={0.25} name="Volume (Units)" />
                          <Area type="monotone" dataKey="dock_load_pct" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} name="Dock Load %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-200 mb-3">Suppliers Inbound Roster</h3>
                    <div className="rounded-xl border border-stone-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-950 text-stone-400 uppercase">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3">Origin</th>
                            <th className="p-3">Item Category</th>
                            <th className="p-3">Lead Time</th>
                            <th className="p-3">Monthly Vol</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800 text-stone-300">
                          {data.suppliers?.map((s) => (
                            <tr key={s.supplier_id} className="hover:bg-stone-800/40">
                              <td className="p-3 font-mono text-yellow-400">{s.supplier_id}</td>
                              <td className="p-3 font-bold text-stone-100">{s.name}</td>
                              <td className="p-3">{s.origin_city}</td>
                              <td className="p-3">{s.item_type}</td>
                              <td className="p-3">{s.lead_time_days} days</td>
                              <td className="p-3 font-mono">{s.volume_history?.toLocaleString()} u</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. OUTBOUND DRILLDOWN */}
              {metricType === 'outbound' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">SLA Compliance</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {data.forecast?.sla_compliance_pct}%
                      </div>
                      <div className="text-xs text-stone-500 mt-1">Target benchmark: 95.0%</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Active Dispatches Today</div>
                      <div className="text-2xl font-black text-stone-100 mt-1">
                        {data.forecast?.active_dispatches}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">On-time departure rate: 98.4%</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Surge Projection</div>
                      <div className="text-sm font-bold text-amber-400 mt-2">
                        {data.forecast?.surge_projection_pct}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">Next 7 days: {data.forecast?.projected_7day_dispatches?.toLocaleString()} total</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                    <h3 className="text-sm font-semibold text-stone-200 mb-3">
                      7-Day Projected Outbound Orders vs SLA Rate
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.forecast?.forecast_days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                          <XAxis dataKey="day" stroke="#A8A29E" />
                          <YAxis stroke="#A8A29E" />
                          <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderColor: '#44403C' }} />
                          <Line type="monotone" dataKey="dispatches" stroke="#78350F" strokeWidth={3} name="Dispatches (Units)" />
                          <Line type="monotone" dataKey="sla_compliance_pct" stroke="#10B981" strokeWidth={2} name="SLA Compliance %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-200 mb-3">Active Customer Destination Corridors</h3>
                    <div className="rounded-xl border border-stone-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-950 text-stone-400 uppercase">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Destination City</th>
                            <th className="p-3">Region</th>
                            <th className="p-3">Contractual SLA</th>
                            <th className="p-3">Monthly Volume</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800 text-stone-300">
                          {data.customers?.map((c) => (
                            <tr key={c.customer_id} className="hover:bg-stone-800/40">
                              <td className="p-3 font-mono text-amber-400">{c.customer_id}</td>
                              <td className="p-3 font-bold text-stone-100">{c.destination_city}</td>
                              <td className="p-3">{c.region}</td>
                              <td className="p-3">{c.sla_hours} hours</td>
                              <td className="p-3 font-mono">{c.avg_volume?.toLocaleString()} orders</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. INVENTORY DRILLDOWN */}
              {metricType === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Total Asset Valuation</div>
                      <div className="text-2xl font-black text-stone-100 mt-1">
                        ${(data.analysis?.total_valuation_usd / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{data.analysis?.total_units?.toLocaleString()} total units on hand</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Safety Stock Breaches</div>
                      <div className="text-2xl font-black text-rose-400 mt-1">
                        {data.analysis?.breached_skus_count} SKUs
                      </div>
                      <div className="text-xs text-rose-300 mt-1">Requires immediate emergency purchase orders</div>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                      <div className="text-xs text-stone-400 font-medium">Buffer Trajectory</div>
                      <div className="text-sm font-bold text-emerald-400 mt-2">
                        {data.analysis?.trajectory_summary}
                      </div>
                    </div>
                  </div>

                  {data.analysis?.breached_items?.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Safety Stock Deficit Roster
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {data.analysis.breached_items.map((b) => (
                          <div key={b.sku_id} className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs space-y-1">
                            <div className="font-mono font-bold text-yellow-400">{b.sku_id} ({b.category})</div>
                            <div className="text-stone-300">Stock: <strong className="text-rose-400">{b.stock_on_hand}</strong> / Target {b.safety_stock}</div>
                            <div className="text-stone-400">Deficit: -{b.deficit} units ({b.days_to_stockout} days to stockout)</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-stone-200 mb-3">Active SKU Inventory Matrix</h3>
                    <div className="rounded-xl border border-stone-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-950 text-stone-400 uppercase">
                          <tr>
                            <th className="p-3">SKU ID</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Stock on Hand</th>
                            <th className="p-3">Safety Stock</th>
                            <th className="p-3">Turnover Ratio</th>
                            <th className="p-3">Velocity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800 text-stone-300">
                          {data.inventory_items?.map((item) => {
                            const isBreached = item.stock_on_hand < item.safety_stock;
                            return (
                              <tr key={item.sku_id} className={isBreached ? 'bg-rose-950/10' : 'hover:bg-stone-800/40'}>
                                <td className="p-3 font-mono text-yellow-400">{item.sku_id}</td>
                                <td className="p-3">{item.category}</td>
                                <td className="p-3 font-bold">{item.stock_on_hand?.toLocaleString()}</td>
                                <td className="p-3">{item.safety_stock?.toLocaleString()}</td>
                                <td className="p-3 font-mono">{item.turnover_ratio}x</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isBreached ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {item.movement_velocity}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. THROUGHPUT & WAREHOUSE-SPECIFIC INBOUND VS OUTBOUND COMPARISON */}
              {metricType === 'throughput' && (
                <div className="space-y-6">
                  
                  {/* SUB-VIEW 1: STANDARD THROUGHPUT & WORKSTATIONS */}
                  {throughputTab === 'standard' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                          <div className="text-xs text-stone-400 font-medium">Throughput Rate</div>
                          <div className="text-2xl font-black text-yellow-400 mt-1">
                            {data.kpis?.processed_units_per_hour}
                          </div>
                          <div className="text-xs text-stone-500 mt-1">Units / hour</div>
                        </div>
                        <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                          <div className="text-xs text-stone-400 font-medium">Order Cycle Time</div>
                          <div className="text-2xl font-black text-stone-100 mt-1">
                            {data.kpis?.cycle_time_minutes}m
                          </div>
                          <div className="text-xs text-stone-500 mt-1">Dock-to-dispatch</div>
                        </div>
                        <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                          <div className="text-xs text-stone-400 font-medium">Capacity Utilization</div>
                          <div className="text-2xl font-black text-emerald-400 mt-1">
                            {data.kpis?.capacity_utilization_pct}%
                          </div>
                          <div className="text-xs text-stone-500 mt-1">Peak efficiency zone</div>
                        </div>
                        <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700">
                          <div className="text-xs text-stone-400 font-medium">Active Workforce</div>
                          <div className="text-2xl font-black text-stone-100 mt-1">
                            {data.kpis?.active_workers} Staff
                          </div>
                          <div className="text-xs text-yellow-400 mt-1">Avg eff: {data.kpis?.avg_workforce_efficiency}%</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                        <h3 className="text-sm font-semibold text-stone-200 mb-3">
                          Shift Throughput Trend vs Target Benchmark (Hourly)
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.kpis?.hourly_trend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                              <XAxis dataKey="time" stroke="#A8A29E" />
                              <YAxis stroke="#A8A29E" />
                              <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderColor: '#44403C' }} />
                              <Bar dataKey="units" fill="#EAB308" name="Actual Processed Units" />
                              <Bar dataKey="target" fill="#78350F" name="Target Benchmark" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-stone-200 mb-3">Workforce Skill Matrix & Efficiency Roster</h3>
                        <div className="rounded-xl border border-stone-800 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-950 text-stone-400 uppercase">
                              <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Primary Skill</th>
                                <th className="p-3">Secondary Skill</th>
                                <th className="p-3">Shift</th>
                                <th className="p-3">Efficiency Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800 text-stone-300">
                              {data.workforce?.map((w) => (
                                <tr key={w.employee_id} className="hover:bg-stone-800/40">
                                  <td className="p-3 font-mono text-yellow-400">{w.employee_id}</td>
                                  <td className="p-3 font-bold text-stone-100">{w.name}</td>
                                  <td className="p-3 font-semibold text-stone-200">{w.primary_skill}</td>
                                  <td className="p-3 text-stone-400">{w.secondary_skill}</td>
                                  <td className="p-3">{w.shift}</td>
                                  <td className="p-3 font-mono font-bold text-emerald-400">
                                    {Math.round(w.efficiency_score * 100)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 2: WAREHOUSE-SPECIFIC INBOUND VS OUTBOUND COMPARISON */}
                  {throughputTab === 'comparison' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      
                      {/* Comparison Bar Chart: Inbound (Yellow) vs Outbound (Dark Brown) */}
                      <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                              <GitCompare className="w-4 h-4 text-yellow-400" />
                              Warehouse-Specific Inbound vs Outbound Volumes
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              Side-by-side volume comparison across regional UPS cross-dock facilities
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <span className="w-3 h-3 rounded bg-[#EAB308]" />
                              <span className="text-yellow-400 font-bold">Inbound Volume</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <span className="w-3 h-3 rounded bg-[#78350F]" />
                              <span className="text-amber-200 font-bold">Outbound Orders</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-68">
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={filteredComparisons} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                              <XAxis dataKey="city" stroke="#A8A29E" />
                              <YAxis stroke="#A8A29E" />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1C1917', borderColor: '#44403C' }}
                                formatter={(val, name) => [`${val} units`, name]}
                              />
                              <Legend />
                              <Bar dataKey="inbound_volume" fill="#EAB308" name="Inbound Volume (Units/Day)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="outbound_volume" fill="#78350F" name="Outbound Dispatches (Orders/Day)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Net Volume Balance Gauge Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredComparisons.map((c) => {
                          const isSurplus = c.net_flow >= 0;
                          return (
                            <div key={c.warehouse_id} className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-stone-100">{c.city}</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  isSurplus
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {c.flow_status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-stone-400 block">Inbound Volume</span>
                                  <span className="font-mono font-bold text-yellow-400">{c.inbound_volume} u</span>
                                  <span className="text-[10px] text-stone-500 block">({c.inbound_dock_load_pct}% load)</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-stone-400 block">Outbound Volume</span>
                                  <span className="font-mono font-bold text-amber-200">{c.outbound_volume} u</span>
                                  <span className="text-[10px] text-stone-500 block">({c.outbound_sla_pct}% SLA)</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-stone-400">Net Flow Balance:</span>
                                <span className={`font-mono font-bold ${isSurplus ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {isSurplus ? `+${c.net_flow}` : c.net_flow} u/day
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Comparison Table */}
                      <div>
                        <h3 className="text-sm font-semibold text-stone-200 mb-2">
                          Facility Operational Inbound/Outbound Comparison Matrix
                        </h3>
                        <div className="rounded-xl border border-stone-800 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-950 text-stone-400 uppercase">
                              <tr>
                                <th className="p-3">Facility</th>
                                <th className="p-3">Dock Doors</th>
                                <th className="p-3">Inbound Flow</th>
                                <th className="p-3">Outbound Dispatches</th>
                                <th className="p-3">Net Flow Balance</th>
                                <th className="p-3">SLA Compliance</th>
                                <th className="p-3">Operational Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800 text-stone-300">
                              {comparisons.map((comp) => {
                                const isSurplus = comp.net_flow >= 0;
                                return (
                                  <tr key={comp.warehouse_id} className="hover:bg-stone-800/40">
                                    <td className="p-3">
                                      <div className="font-bold text-stone-100">{comp.city}</div>
                                      <div className="text-[10px] text-stone-400 font-mono">{comp.warehouse_id}</div>
                                    </td>
                                    <td className="p-3 font-mono">{comp.dock_doors} doors</td>
                                    <td className="p-3 font-mono font-bold text-yellow-400">
                                      {comp.inbound_volume} u/day
                                    </td>
                                    <td className="p-3 font-mono font-bold text-amber-200">
                                      {comp.outbound_volume} u/day
                                    </td>
                                    <td className="p-3 font-mono font-bold">
                                      <span className={isSurplus ? 'text-emerald-400' : 'text-amber-400'}>
                                        {isSurplus ? `+${comp.net_flow}` : comp.net_flow} u
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-emerald-400 font-bold">
                                      {comp.outbound_sla_pct}%
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        comp.inbound_dock_load_pct > 80
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      }`}>
                                        {comp.flow_status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-stone-500 py-10">No granular telemetry available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricModal;
