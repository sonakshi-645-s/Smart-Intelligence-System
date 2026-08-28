import React, { useState, useEffect } from 'react';
import {
  Truck, Send, Package, Activity, ChevronRight,
  ShieldCheck, RefreshCw, Building, AlertTriangle, ArrowUpRight,
  Database, UploadCloud
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import SupplyChainMap from '../components/SupplyChainMap';
import MetricModal from '../components/MetricModal';

const Dashboard = ({ activeWarehouse, onSwitchWarehouse, onNavigateToProfile }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [throughputInitialTab, setThroughputInitialTab] = useState('standard');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = (whId) => {
    setRefreshing(true);
    const targetWh = whId || activeWarehouse?.warehouse_id || '';
    const url = targetWh ? `/dashboard/overview/?warehouse_id=${targetWh}` : '/dashboard/overview/';

    api.get(url)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDashboardData(activeWarehouse?.warehouse_id);

    const handleDatasetsUpdate = () => {
      fetchDashboardData(activeWarehouse?.warehouse_id);
    };
    window.addEventListener('datasetsUpdated', handleDatasetsUpdate);
    return () => window.removeEventListener('datasetsUpdated', handleDatasetsUpdate);
  }, [activeWarehouse]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin shadow-glow-amber" />
        <div className="text-sm font-semibold text-stone-300 tracking-wide">
          Curating Warehouse Telemetry & Predictive Models...
        </div>
      </div>
    );
  }

  const { metrics, map, security_hardening, available_warehouses = [] } = data || {};
  const currentWh = data?.active_warehouse || activeWarehouse;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner & Facility Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-black text-stone-100 tracking-tight">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Facility Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Facility Pill / Switcher */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs">
            <Building className="w-4 h-4 text-yellow-400" />
            <span className="text-stone-400 hidden sm:inline">{t('dashboard.warehouseActive')}:</span>
            <select
              value={currentWh?.warehouse_id || ''}
              onChange={(e) => {
                const wh = available_warehouses.find((w) => w.warehouse_id === e.target.value);
                if (onSwitchWarehouse && wh) onSwitchWarehouse(wh);
                fetchDashboardData(e.target.value);
              }}
              className="bg-transparent text-yellow-400 font-bold outline-none cursor-pointer"
            >
              {available_warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id} className="bg-stone-900 text-stone-200">
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchDashboardData(currentWh?.warehouse_id)}
            disabled={refreshing}
            className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Refresh Real-Time Warehouse Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-yellow-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 DYNAMIC FLOATING METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: INBOUND OPERATIONS */}
        <div
          onClick={() => setSelectedMetric('inbound')}
          className="glass-card glass-card-hover p-5 cursor-pointer relative group border-t-2 border-t-yellow-500 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {t('dashboard.inboundTitle')}
              </div>
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-mono">
                  {(metrics?.inbound?.total_dataset_volume || metrics?.inbound?.projected_7day_volume)?.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-yellow-400">Total Units</span>
              </div>
              <p className="text-xs text-stone-300 mt-1 flex items-center justify-between">
                <span>{metrics?.inbound?.supplier_count || 10} Active Vendors</span>
                <span className="font-semibold text-yellow-400">Dock: {metrics?.inbound?.dock_load_pct}%</span>
              </p>
              <div className="mt-1 text-[11px] text-stone-400 flex items-center gap-1">
                <span>Waiting Trucks:</span>
                <strong className="text-stone-200">{metrics?.inbound?.waiting_queue_trucks} trucks at bay</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">
              Daily Rate: <strong className="text-yellow-400">{metrics?.inbound?.daily_volume?.toLocaleString() || '5,473'} u/day</strong>
            </span>
            <button className="text-yellow-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              {t('dashboard.moreDetails')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: OUTBOUND ORDERS & DELIVERIES */}
        <div
          onClick={() => setSelectedMetric('outbound')}
          className="glass-card glass-card-hover p-5 cursor-pointer relative group border-t-2 border-t-[#78350F] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {t('dashboard.outboundTitle')}
              </div>
              <div className="p-2 rounded-xl bg-[#78350F]/20 text-amber-400 border border-[#78350F]/40 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-mono">
                  {(metrics?.outbound?.total_dataset_volume || metrics?.outbound?.projected_7day_dispatches)?.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-amber-300">Total Orders</span>
              </div>
              <p className="text-xs text-stone-300 mt-1 flex items-center justify-between">
                <span>{metrics?.outbound?.customer_count || 10} Delivery Corridors</span>
                <span className="font-semibold text-emerald-400">SLA: {metrics?.outbound?.sla_compliance_pct}%</span>
              </p>
              <div className="mt-1 text-[11px] text-stone-400 flex items-center gap-1">
                <span>Today's Dispatches:</span>
                <strong className="text-stone-200">{metrics?.outbound?.active_dispatches?.toLocaleString()} units</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-medium text-[11px] truncate max-w-[140px]">
              {metrics?.outbound?.surge_projection || 'Standard Flow'}
            </span>
            <button className="text-amber-300 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              {t('dashboard.moreDetails')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 3: INVENTORY VALUATION & MOVEMENT */}
        <div
          onClick={() => setSelectedMetric('inventory')}
          className="glass-card glass-card-hover p-5 cursor-pointer relative group border-t-2 border-t-rose-500 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {t('dashboard.inventoryTitle')}
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-100 font-mono">
                  {(metrics?.inventory?.total_dataset_units || metrics?.inventory?.total_units)?.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-stone-400">Stock Units</span>
              </div>
              <p className="text-xs text-stone-300 mt-1 flex items-center justify-between">
                <span>{metrics?.inventory?.sku_count || 12} Active SKUs</span>
                <span className="font-semibold text-stone-200">${((metrics?.inventory?.total_valuation_usd || 0) / 1000000).toFixed(2)}M</span>
              </p>
              <div className="mt-1 text-[11px] text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{metrics?.inventory?.safety_stock_breaches} SKUs below safety stock</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">
              Trajectory: <strong className="text-yellow-400">{metrics?.inventory?.safety_stock_breaches ? 'Reorders Needed' : 'Adequate Buffer'}</strong>
            </span>
            <button className="text-yellow-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              {t('dashboard.moreDetails')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4: THROUGHPUT & EFFICIENCY */}
        <div
          onClick={() => {
            setThroughputInitialTab('standard');
            setSelectedMetric('throughput');
          }}
          className="glass-card glass-card-hover p-5 cursor-pointer relative group border-t-2 border-t-amber-500 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {t('dashboard.throughputTitle')}
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-yellow-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono">
                  {metrics?.throughput?.processed_units_per_hour?.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-stone-400">u/hr</span>
              </div>
              <p className="text-xs text-stone-300 mt-1 flex items-center justify-between">
                <span>Workforce: <strong>{metrics?.throughput?.total_workforce_count || 18} Staff</strong></span>
                <span className="font-semibold text-emerald-400">Util: {metrics?.throughput?.capacity_utilization_pct}%</span>
              </p>
              <div className="mt-1 text-[11px] text-stone-400 flex items-center gap-1">
                <span>Shifts:</span>
                <strong className="text-stone-300">
                  {metrics?.throughput?.morning_shift_count || 7}M / {metrics?.throughput?.evening_shift_count || 6}E / {metrics?.throughput?.night_shift_count || 5}N
                </strong>
              </div>
            </div>

            {/* Inbound vs Outbound Comparison Quick Action */}
            <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-stone-950/70 border border-stone-800 text-[11px]">
              <span className="text-stone-300 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Inbound vs Outbound
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setThroughputInitialTab('comparison');
                  setSelectedMetric('throughput');
                }}
                className="text-yellow-400 font-bold hover:underline flex items-center gap-0.5"
              >
                Compare Hubs <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Cycle: <strong className="text-stone-200">{metrics?.throughput?.cycle_time_minutes}m</strong></span>
            <button className="text-yellow-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              {t('dashboard.moreDetails')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE GEOSPATIAL MAP (YELLOW INBOUND & DARK BROWN OUTBOUND) */}
      <SupplyChainMap mapData={map} />

      {/* Drilldown Modal */}
      <MetricModal
        metricType={selectedMetric}
        initialThroughputTab={throughputInitialTab}
        warehouseId={currentWh?.warehouse_id}
        onClose={() => setSelectedMetric(null)}
      />
    </div>
  );
};

export default Dashboard;
