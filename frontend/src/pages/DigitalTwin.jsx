import React, { useState, useEffect } from 'react';
import {
  Boxes, Sliders, AlertTriangle, ShieldCheck, Zap, Gauge, DollarSign, Clock, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const DigitalTwin = () => {
  const { t } = useLanguage();
  const [params, setParams] = useState({
    volume_shock_pct: 25,
    absenteeism_pct: 12,
    transit_delay_hours: 8,
  });

  const [simResults, setSimResults] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = (newParams) => {
    const payload = newParams || params;
    setSimulating(true);
    api.post('/simulation/run/', payload)
      .then((res) => {
        setSimResults(res.data);
      })
      .catch((err) => {
        console.error('Simulation error:', err);
      })
      .finally(() => setSimulating(false));
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleSliderChange = (key, val) => {
    const next = { ...params, [key]: Number(val) };
    setParams(next);
    runSimulation(next);
  };

  const applyPreset = (preset) => {
    setParams(preset);
    runSimulation(preset);
  };

  const { impacts, mitigation_recommendations = [], timeline = [] } = simResults || {};

  return (
    <div className="space-y-6">
      {/* Subpage Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h2 className="text-xl font-black text-stone-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-yellow-400" />
            {t('digitalTwin.title')}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {t('digitalTwin.subtitle')}
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset({ volume_shock_pct: 0, absenteeism_pct: 0, transit_delay_hours: 0 })}
            className="px-3 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-700 text-xs font-semibold text-stone-300 transition-colors"
          >
            {t('digitalTwin.presetBaseline')}
          </button>
          <button
            onClick={() => applyPreset({ volume_shock_pct: 50, absenteeism_pct: 15, transit_delay_hours: 12 })}
            className="px-3 py-1.5 rounded-lg bg-yellow-950/40 hover:bg-yellow-900/50 border border-yellow-500/40 text-xs font-bold text-yellow-300 transition-colors"
          >
            {t('digitalTwin.presetSurge')}
          </button>
          <button
            onClick={() => applyPreset({ volume_shock_pct: 20, absenteeism_pct: 35, transit_delay_hours: 24 })}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-xs font-bold text-rose-300 transition-colors"
          >
            {t('digitalTwin.presetBlizzard')}
          </button>
        </div>
      </div>

      {/* SLIDER CONTROLS & GAUGES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Panel */}
        <div className="glass-card p-6 rounded-2xl border border-stone-800 space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-yellow-400" />
              Scenario Control Parameters
            </h3>
            {simulating && (
              <span className="text-[11px] text-yellow-400 font-mono animate-pulse">
                Simulating...
              </span>
            )}
          </div>

          {/* Slider 1: Volume Shock */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-300">{t('digitalTwin.volumeShock')}</span>
              <span className="font-mono text-yellow-400 font-bold">
                {params.volume_shock_pct > 0 ? `+${params.volume_shock_pct}%` : `${params.volume_shock_pct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={params.volume_shock_pct}
              onChange={(e) => handleSliderChange('volume_shock_pct', e.target.value)}
              className="w-full accent-yellow-400 h-2 bg-stone-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>-50% Slump</span>
              <span>Nominal (0%)</span>
              <span>+100% Shock</span>
            </div>
          </div>

          {/* Slider 2: Absenteeism */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-300">{t('digitalTwin.absenteeism')}</span>
              <span className="font-mono text-rose-400 font-bold">
                {params.absenteeism_pct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={params.absenteeism_pct}
              onChange={(e) => handleSliderChange('absenteeism_pct', e.target.value)}
              className="w-full accent-rose-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>0% Full Staff</span>
              <span>25% Moderate</span>
              <span>50% Critical</span>
            </div>
          </div>

          {/* Slider 3: Transit Delay */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-300">{t('digitalTwin.transitDelay')}</span>
              <span className="font-mono text-amber-400 font-bold">
                {params.transit_delay_hours} {t('common.hours')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="72"
              step="4"
              value={params.transit_delay_hours}
              onChange={(e) => handleSliderChange('transit_delay_hours', e.target.value)}
              className="w-full accent-amber-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>0h On-Time</span>
              <span>24h Delay</span>
              <span>72h Stoppage</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-[11px] text-stone-400">
            Physics engine evaluates non-linear stochastic queueing equations across plant operational cells.
          </div>
        </div>

        {/* 4 Impact Metric Panels */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Dock Congestion */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {t('digitalTwin.dockCongestionRisk')}
              </div>
              <div className="text-3xl font-black text-yellow-400 font-mono mt-2">
                {impacts?.dock_congestion_risk_pct}%
              </div>
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${impacts?.dock_congestion_risk_pct || 0}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-stone-400 mt-4">
              Baseline nominal dock buffer: 34%
            </div>
          </div>

          {/* SLA Breach Risk */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {t('digitalTwin.slaBreachRisk')}
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono mt-2">
                {impacts?.sla_breach_risk_pct}%
              </div>
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${impacts?.sla_breach_risk_pct || 0}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-stone-400 mt-4">
              Contractual tolerance limit: 15.0%
            </div>
          </div>

          {/* Bottleneck Index */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {t('digitalTwin.bottleneckIndex')}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-stone-100 font-mono">
                  {impacts?.bottleneck_index}
                </span>
                <span className="text-xs text-stone-400">/ 5.0 max</span>
              </div>
              <div className="mt-2 text-xs font-bold font-mono" style={{ color: impacts?.bottleneck_color }}>
                {impacts?.bottleneck_status}
              </div>
            </div>
            <div className="text-xs text-stone-400 mt-4">
              1.0 = Fluid Flow | 5.0 = Complete Gridlock
            </div>
          </div>

          {/* Projected Unit Cost */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {t('digitalTwin.unitCost')}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  ${impacts?.projected_unit_cost?.toFixed(2)}
                </span>
                <span className={`text-xs font-bold ${impacts?.cost_delta_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {impacts?.cost_delta_pct > 0 ? `+${impacts?.cost_delta_pct}%` : `${impacts?.cost_delta_pct}%`}
                </span>
              </div>
            </div>
            <div className="text-xs text-stone-400 mt-4">
              Nominal benchmark: $4.20 / unit
            </div>
          </div>
        </div>
      </div>

      {/* 24-HOUR PROJECTED FLOW & QUEUE CHART */}
      <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-4">
        <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          {t('digitalTwin.timelineChartTitle')}
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
              <XAxis dataKey="hour" stroke="#A8A29E" />
              <YAxis stroke="#A8A29E" />
              <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderColor: '#44403C' }} />
              <Legend />
              <Area type="monotone" dataKey="processed_flow" stroke="#EAB308" strokeWidth={2} fill="url(#colorFlow)" name="Flow (Units/Hr)" />
              <Area type="monotone" dataKey="queue_backlog" stroke="#EF4444" strokeWidth={2} fill="url(#colorQueue)" name="Queue Backlog (Units)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MITIGATION DIRECTIVES */}
      <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-3">
        <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {t('digitalTwin.mitigationPlan')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mitigation_recommendations.map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300">
              <span className="text-yellow-400 font-bold mr-1.5">Directive #{i+1}:</span>
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
