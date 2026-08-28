import React, { useState, useEffect } from 'react';
import {
  Sliders, TrendingUp, TrendingDown, DollarSign,
  Truck, CheckCircle2, RefreshCw, Activity, ArrowRight
} from 'lucide-react';
import api from '../utils/api';

const Simulator = ({ activeWarehouse }) => {
  // Fully typed inputs from user
  const [scenarioText, setScenarioText] = useState('High demand surge with workforce shortage');
  const [volumeShock, setVolumeShock] = useState(25);
  const [absenteeism, setAbsenteeism] = useState(15);
  const [transitDelay, setTransitDelay] = useState(12);
  const [costInflation, setCostInflation] = useState(5);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    api.post('/simulation/run/', {
      scenario_name: scenarioText || 'Custom User Scenario',
      volume_shock_pct: Number(volumeShock) || 0,
      absenteeism_pct: Number(absenteeism) || 0,
      transit_delay_hours: Number(transitDelay) || 0,
      cost_inflation_pct: Number(costInflation) || 0,
      warehouse_id: activeWarehouse?.warehouse_id || null,
    })
      .then((res) => {
        setResults(res.data);
      })
      .catch((err) => {
        console.error('Simulation error:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    handleSimulate();
  }, [activeWarehouse]);

  const pnl = results?.profits_and_losses;
  const impacts = results?.impact_percentages;
  const costs = results?.cost_measurements;

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-yellow-500" />
            Simulator
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Type your scenario and view its major operational impacts
          </p>
        </div>

        {activeWarehouse && (
          <div className="text-xs px-3 py-1 rounded-xl bg-stone-900 border border-stone-700 text-stone-300">
            Facility: <strong className="text-yellow-400">{activeWarehouse.name}</strong>
          </div>
        )}
      </div>

      {/* USER TYPED INPUT SECTION */}
      <form onSubmit={handleSimulate} className="glass-card p-5 rounded-2xl border border-stone-800 space-y-4">
        <div>
          <label className="text-xs font-bold text-stone-200 block mb-1.5">
            Scenario Description
          </label>
          <input
            type="text"
            value={scenarioText}
            onChange={(e) => setScenarioText(e.target.value)}
            placeholder="Type your scenario (e.g. 30% surge in customer orders with 10% worker shortage)"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-stone-100 outline-none focus:border-yellow-500 font-medium"
          />
        </div>

        {/* Typed Numerical Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 block">
              Volume Change (%)
            </label>
            <input
              type="number"
              value={volumeShock}
              onChange={(e) => setVolumeShock(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 block">
              Absenteeism (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={absenteeism}
              onChange={(e) => setAbsenteeism(e.target.value)}
              placeholder="e.g. 15"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 block">
              Transit Delay (Hrs)
            </label>
            <input
              type="number"
              min="0"
              value={transitDelay}
              onChange={(e) => setTransitDelay(e.target.value)}
              placeholder="e.g. 12"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 block">
              Cost Inflation (%)
            </label>
            <input
              type="number"
              min="0"
              value={costInflation}
              onChange={(e) => setCostInflation(e.target.value)}
              placeholder="e.g. 5"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Simulate Scenario</span>
          </button>
        </div>
      </form>

      {/* MAJOR IMPACTS DISPLAY */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
              Major Impacts
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              Scenario: "{scenarioText || 'Custom'}"
            </span>
          </div>

          {/* 4 Primary Major Impacts Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Impact 1: Profit & Loss */}
            <div className={`p-4 rounded-xl border space-y-1.5 ${
              pnl?.is_profit
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-400'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                <span>Profit & Loss</span>
                {pnl?.is_profit ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="text-2xl font-black font-mono">
                {pnl?.is_profit ? '+' : ''}${Math.abs(pnl?.net_profit_impact_usd || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-400">
                {pnl?.net_profit_impact_pct >= 0 ? `+${pnl?.net_profit_impact_pct}%` : `${pnl?.net_profit_impact_pct}%`} net margin impact
              </p>
            </div>

            {/* Impact 2: Dock Congestion */}
            <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                <span>Dock Congestion</span>
                <Truck className="w-4 h-4 text-yellow-400" />
              </div>
              <div className={`text-2xl font-black font-mono ${
                (impacts?.dock_congestion_impact_pct || 0) > 15 ? 'text-rose-400' : 'text-stone-100'
              }`}>
                {impacts?.dock_congestion_impact_pct >= 0 ? `+${impacts?.dock_congestion_impact_pct}` : impacts?.dock_congestion_impact_pct}%
              </div>
              <p className="text-[11px] text-stone-400">
                Change in dock load capacity
              </p>
            </div>

            {/* Impact 3: SLA Delivery */}
            <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                <span>SLA Deliveries</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-2xl font-black font-mono ${
                (impacts?.sla_compliance_impact_pct || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {impacts?.sla_compliance_impact_pct >= 0 ? `+${impacts?.sla_compliance_impact_pct}` : impacts?.sla_compliance_impact_pct}%
              </div>
              <p className="text-[11px] text-stone-400">
                On-time contractual compliance shift
              </p>
            </div>

            {/* Impact 4: Unit Handling Cost */}
            <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                <span>Cost Per Unit</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-stone-100">
                ${costs?.simulated_unit_cost_usd || '4.50'}
              </div>
              <p className="text-[11px] text-stone-400">
                {costs?.unit_cost_delta_pct >= 0 ? `+${costs?.unit_cost_delta_pct}%` : `${costs?.unit_cost_delta_pct}%`} handling cost shift
              </p>
            </div>

          </div>

          {/* Simple Impact Summary Strip */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300 space-y-1">
            <strong className="text-stone-100 block font-bold">Summary:</strong>
            <p>
              Simulating <strong>{scenarioText}</strong> with a {volumeShock}% volume change and {absenteeism}% absenteeism results in a{' '}
              <strong className={pnl?.is_profit ? 'text-emerald-400' : 'text-rose-400'}>
                {pnl?.is_profit ? 'profit gain' : 'operating loss'} of ${Math.abs(pnl?.net_profit_impact_usd || 0).toLocaleString()}
              </strong>
              , with dock congestion shifting by {impacts?.dock_congestion_impact_pct}% and SLA compliance shifting by {impacts?.sla_compliance_impact_pct}%.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Simulator;
