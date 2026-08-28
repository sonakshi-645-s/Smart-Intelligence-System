import React, { useState, useEffect } from 'react';
import {
  Sparkles, AlertOctagon, CheckCircle2, ArrowRight, Mail, ShieldAlert,
  Users, RefreshCw, Layers, TrendingUp, Check, Cpu, Boxes, Clock, Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import DigitalTwin from './DigitalTwin';

const Recommendations = () => {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState('directives'); // 'directives' or 'digitalTwin'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [activePlanId, setActivePlanId] = useState('REC-PLAN-01');
  const [appliedReceipt, setAppliedReceipt] = useState(null);

  const fetchRecommendations = () => {
    setLoading(true);
    api.get('/recommendations/')
      .then((res) => {
        setData(res.data);
        // Find which plan is currently active
        const active = res.data.recommendations?.find((r) => r.is_active);
        if (active) {
          setActivePlanId(active.id);
        }
      })
      .catch((err) => {
        console.error('Error loading recommendations:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecommendations();

    const handleDatasetsUpdate = () => {
      fetchRecommendations();
    };
    window.addEventListener('datasetsUpdated', handleDatasetsUpdate);
    return () => window.removeEventListener('datasetsUpdated', handleDatasetsUpdate);
  }, []);

  const handleApplySinglePlan = async (recId) => {
    setApplyingId(recId);
    try {
      const res = await api.post(`/recommendations/${recId}/apply/`);
      
      // Update active plan (Mutual Exclusivity: previous plan unclicked!)
      setActivePlanId(recId);
      setAppliedReceipt({
        id: recId,
        message: res.data.message,
        receipt: res.data.dispatch_receipt,
      });

      // Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#78350F', '#10B981'],
        });
      } catch (e) {}

      fetchRecommendations();
    } catch (err) {
      alert('Failed to dispatch action plan: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplyingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin shadow-glow-amber" />
        <div className="text-sm font-semibold text-stone-300">
          Running Skill-Matrix Optimizer, Package Delay Tracer & Anomaly Detector...
        </div>
      </div>
    );
  }

  const { anomalies = [], cell_utilization = [], recommendations = [] } = data || {};

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Subpage Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-100">
              {t('recommendations.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {t('recommendations.subtitle')}
          </p>
        </div>

        {/* Subpage Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-xl border border-stone-800 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setSubTab('directives')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'directives'
                ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            {t('recommendations.tabDirectives')}
          </button>
          <button
            onClick={() => setSubTab('digitalTwin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'digitalTwin'
                ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            {t('recommendations.tabDigitalTwin')}
          </button>
        </div>
      </div>

      {/* SUBPAGE 2: DIGITAL TWIN WHAT-IF SANDBOX */}
      {subTab === 'digitalTwin' && (
        <div className="animate-in fade-in duration-200">
          <DigitalTwin />
        </div>
      )}

      {/* SUBPAGE 1: OPTIMIZATION & SOLVED DIRECTIVES */}
      {subTab === 'directives' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Mutual Exclusivity Notice Strip */}
          <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span>{t('recommendations.singlePlanNotice')}</span>
            </div>
            <button
              onClick={fetchRecommendations}
              className="text-yellow-400 hover:underline flex items-center gap-1 shrink-0 font-semibold text-[11px]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-evaluate
            </button>
          </div>

          {/* Applied Notification Banner */}
          {appliedReceipt && (
            <div className="glass-card p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-300 text-sm">{appliedReceipt.message}</h3>
                    <p className="text-xs text-stone-300 mt-1">
                      {t('recommendations.supervisorEmail')}: <strong className="text-emerald-400">{appliedReceipt.receipt?.recipient}</strong> | Security Token: <code className="bg-stone-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">{appliedReceipt.receipt?.signature_token}</code>
                    </p>
                    <div className="text-[11px] text-stone-400 mt-1 font-mono">
                      {appliedReceipt.receipt?.status_note}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAppliedReceipt(null)}
                  className="text-xs text-stone-400 hover:text-stone-200"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: PROBLEM-SOLVED ACTION PLANS (WITH MUTUAL EXCLUSIVITY) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-stone-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-yellow-400" />
                {t('recommendations.solvedHeader')}
              </h2>
              <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
                5 Algorithmic Solved Directives
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((rec) => {
                const isCurrentActive = activePlanId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className={`glass-card p-5 rounded-2xl flex flex-col justify-between border transition-all duration-300 ${
                      isCurrentActive
                        ? 'border-yellow-500 bg-yellow-950/20 shadow-glow-amber ring-1 ring-yellow-500'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      {/* Category & Efficiency Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                          {rec.category}
                        </span>
                        <span className="text-xs font-black text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 rounded-full shadow-glow-amber">
                          {rec.efficiency_gain}
                        </span>
                      </div>

                      <h3 className="font-bold text-stone-100 text-sm sm:text-base mt-3 leading-snug">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-stone-300 leading-relaxed mt-2">
                        {rec.description}
                      </p>

                      <div className="mt-3 p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs">
                        <span className="text-stone-400 font-medium">{t('recommendations.efficiencyGain')}: </span>
                        <strong className="text-yellow-300">{rec.impact_metric}</strong>
                      </div>

                      {/* Addressed Issue & Scenario Tag */}
                      <div className="mt-2 text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                        <span className="text-stone-500">Scenario:</span>
                        <span className="text-stone-300">{rec.scenario_type}</span>
                      </div>

                      {/* Skill Reassignments */}
                      {rec.reassignments?.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                            Skill Mapping & Reallocation:
                          </div>
                          {rec.reassignments.map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                              <div className="font-bold text-stone-200">{item.name} ({item.worker_id})</div>
                              <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                <span className="truncate">{item.from_cell}</span>
                                <ArrowRight className="w-3 h-3 text-yellow-400 shrink-0" />
                                <span className="text-yellow-400 font-semibold truncate">{item.to_cell}</span>
                              </div>
                              <div className="text-[10px] text-emerald-400 mt-0.5">{item.match_skill}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Apply Now Button with Single Plan Active State */}
                    <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                        <Mail className="w-3.5 h-3.5 text-yellow-400" />
                        <span>TLS Relay Directive</span>
                      </div>

                      <button
                        onClick={() => handleApplySinglePlan(rec.id)}
                        disabled={applyingId === rec.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                          isCurrentActive
                            ? 'bg-yellow-500 text-stone-950 font-black shadow-glow-amber cursor-default'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                        }`}
                      >
                        {isCurrentActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            {t('recommendations.applied')}
                          </>
                        ) : applyingId === rec.id ? (
                          'Dispatching...'
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                            {t('recommendations.applyNow')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: ANOMALY DETECTION (SUDDEN VOLUME SPIKES & PACKAGE DELAYS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-stone-100 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                {t('recommendations.anomaliesHeader')}
              </h2>
              <span className="text-xs text-stone-400">
                {anomalies.length} Operational Alerts Identified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {anomalies.map((anm) => (
                <div
                  key={anm.id}
                  className={`glass-card p-4 rounded-xl border ${
                    anm.severity === 'CRITICAL'
                      ? 'border-rose-900 bg-rose-950/20'
                      : anm.severity === 'HIGH'
                      ? 'border-amber-700/70 bg-amber-950/20'
                      : 'border-stone-800 bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        anm.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : anm.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {anm.severity} {t('recommendations.severity')}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">{anm.origin}</span>
                  </div>

                  <h4 className="font-bold text-sm text-stone-100 mt-2">{anm.title}</h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">{anm.description}</p>

                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-stone-400">{t('recommendations.delayStage')}:</span>
                    <strong className="text-yellow-300">{anm.delay_stage || 'Logistics Node'}</strong>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-800 text-xs">
                    <span className="text-stone-400 font-medium">Resolution: </span>
                    <span className="text-stone-200">{anm.recommended_action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: SKILL-BASED WORKFORCE CELL ALLOCATION & SHIFT DEMAND */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                {t('recommendations.workforceHeader')}
              </h2>
              <span className="text-xs text-stone-400">Shift Planning & Capacity vs Demand</span>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-stone-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Operational Cell</th>
                      <th className="p-3.5">Required Skill</th>
                      <th className="p-3.5">Assigned Workers</th>
                      <th className="p-3.5">Shift Demand (M/E/N)</th>
                      <th className="p-3.5">Capacity vs Demand</th>
                      <th className="p-3.5">Utilization %</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 text-stone-300">
                    {cell_utilization.map((cell) => {
                      const isOver = cell.status === 'Over-Utilized';
                      const isUnder = cell.status === 'Under-Utilized';
                      return (
                        <tr key={cell.cell_id} className="hover:bg-stone-800/30 transition-colors">
                          <td className="p-3.5 font-bold text-stone-100">{cell.cell_name}</td>
                          <td className="p-3.5 text-yellow-400">{cell.required_skill}</td>
                          <td className="p-3.5 font-semibold text-stone-100">{cell.assigned_workers_count} staff</td>
                          <td className="p-3.5 font-mono text-stone-400">
                            {cell.shift_breakdown?.Morning} / {cell.shift_breakdown?.Evening} / {cell.shift_breakdown?.Night}
                          </td>
                          <td className="p-3.5 font-mono">
                            {cell.capacity_units} / {cell.demand_units} units
                          </td>
                          <td className="p-3.5 font-bold font-mono">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-stone-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(cell.utilization_pct, 100)}%` }}
                                />
                              </div>
                              <span>{cell.utilization_pct}%</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOver
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isUnder
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {cell.status}
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
        </div>
      )}
    </div>
  );
};

export default Recommendations;
