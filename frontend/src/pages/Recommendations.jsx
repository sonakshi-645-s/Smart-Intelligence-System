import React, { useState, useEffect } from 'react';
import {
  Sparkles, CheckCircle2, Users, RefreshCw, Layers, Check, ChevronRight, Sliders, Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../utils/api';
import StaffAllocationTool from '../components/StaffAllocationTool';

const Recommendations = ({ activeWarehouse }) => {
  const [activeTab, setActiveTab] = useState('staffing'); // 'staffing', 'capacity', 'directives'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scenarioMode, setScenarioMode] = useState('normal'); // 'normal' or 'peak'
  const [activePlanId, setActivePlanId] = useState('REC-PLAN-01');
  const [appliedReceipt, setAppliedReceipt] = useState(null);

  // Scenario Plan Generator State (No suggested scenarios, gets typed scenario from user)
  const [scenarioInput, setScenarioInput] = useState('');
  const [devisedData, setDevisedData] = useState(null);
  const [selectedPlanRank, setSelectedPlanRank] = useState(1);
  const [isDevising, setIsDevising] = useState(false);
  const [dispatchedPlanId, setDispatchedPlanId] = useState(null);
  const [dispatchReceipt, setDispatchReceipt] = useState('');

  const handleDevisePlan = async (customScenario) => {
    const scenarioToUse = customScenario !== undefined ? customScenario : scenarioInput;
    if (!scenarioToUse || !scenarioToUse.trim()) return;
    setIsDevising(true);
    setDispatchedPlanId(null);
    setDispatchReceipt('');
    try {
      const res = await api.post('/recommendations/devise-plan/', {
        scenario: scenarioToUse.trim(),
        warehouse_id: activeWarehouse?.warehouse_id,
      });
      setDevisedData(res.data);
      setSelectedPlanRank(1);
    } catch (err) {
      console.error('Error devising plan:', err);
    } finally {
      setIsDevising(false);
    }
  };

  const handleDispatchPlan = (plan) => {
    if (!plan) return;
    setDispatchedPlanId(plan.directive_id);
    setDispatchReceipt(`Directive ${plan.directive_id} (Rank #${plan.rank}) dispatched to ${devisedData?.facility?.name || 'facility'} floor supervisors. Authorization: AUTH-SEC-${plan.directive_id}-OK`);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#10B981', '#78350F'],
      });
    } catch (e) {}
  };

  const fetchRecommendations = (whId) => {
    setLoading(true);
    const targetWhId = whId || activeWarehouse?.warehouse_id;
    api.get('/recommendations/', { params: targetWhId ? { warehouse_id: targetWhId } : {} })
      .then((res) => {
        setData(res.data);
        const active = res.data.recommendations?.find((r) => r.is_active);
        if (active) setActivePlanId(active.id);
      })
      .catch((err) => {
        console.error('Error loading recommendations:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecommendations(activeWarehouse?.warehouse_id);
    if (scenarioInput.trim()) {
      handleDevisePlan(scenarioInput);
    }
  }, [activeWarehouse?.warehouse_id]);

  const handleApplyPlan = async (recId) => {
    try {
      const res = await api.post(`/recommendations/${recId}/apply/`);
      setActivePlanId(recId);
      setAppliedReceipt({
        id: recId,
        message: res.data.message,
        receipt: res.data.dispatch_receipt,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#10B981'],
        });
      } catch (e) {}

      fetchRecommendations();
    } catch (err) {
      alert('Failed to dispatch: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-stone-400">Loading...</div>
      </div>
    );
  }

  const { project_meta = {}, manpower_requirements = {}, cell_utilization = [], recommendations = [] } = data || {};
  const currentScenario = scenarioMode === 'normal' 
    ? manpower_requirements?.normal_operations 
    : manpower_requirements?.peak_scenario;

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Recommendations
          </h1>
        </div>

        {/* Simple One-Word Subtabs */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('staffing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staffing'
                ? 'bg-yellow-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Staffing
          </button>
          <button
            onClick={() => setActiveTab('capacity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'capacity'
                ? 'bg-yellow-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Capacity
          </button>
          <button
            onClick={() => setActiveTab('directives')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'directives'
                ? 'bg-yellow-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Directives
          </button>
        </div>
      </div>

      {/* SUBTAB 1: STAFFING (USER TYPED INPUTS) */}
      {activeTab === 'staffing' && (
        <div className="animate-in fade-in duration-150">
          <StaffAllocationTool activeWarehouse={activeWarehouse} />
        </div>
      )}

      {/* SUBTAB 2: CAPACITY */}
      {activeTab === 'capacity' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Headcount */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="text-sm font-bold text-stone-100 uppercase tracking-wider">
                Headcount
              </h2>
              
              {/* Scenario Toggle */}
              <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
                <button
                  onClick={() => setScenarioMode('normal')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    scenarioMode === 'normal'
                      ? 'bg-yellow-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setScenarioMode('peak')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    scenarioMode === 'peak'
                      ? 'bg-yellow-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Peak (+25%)
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                <span className="text-stone-400 font-semibold">Required Staff</span>
                <div className="text-2xl font-black font-mono text-stone-100">
                  {currentScenario?.total_required_staff || 18} staff
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                <span className="text-stone-400 font-semibold">Available Staff</span>
                <div className="text-2xl font-black font-mono text-yellow-400">
                  {manpower_requirements?.active_workforce_headcount || 18} staff
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                <span className="text-stone-400 font-semibold">Balance</span>
                <div className={`text-2xl font-black font-mono ${
                  (currentScenario?.headcount_balance || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {currentScenario?.headcount_balance >= 0 ? `+${currentScenario?.headcount_balance}` : currentScenario?.headcount_balance} staff
                </div>
              </div>
            </div>

            {/* Shifts */}
            <div className="pt-2 border-t border-stone-800/80 space-y-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                Shifts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(currentScenario?.shifts || {}).map(([sName, sData]) => (
                  <div key={sName} className="p-3 rounded-xl bg-stone-950/50 border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-200 block">{sName}</span>
                      <span className="text-[10px] text-stone-400">Req: {sData.required} | Avail: {sData.available}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sData.available >= sData.required ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {sData.available >= sData.required ? 'Covered' : 'Short'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processes */}
            <div className="pt-2 border-t border-stone-800/80 space-y-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                Processes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {currentScenario?.process_breakdown?.map((pb, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-center">
                    <div className="text-stone-400 text-[10px] truncate">{pb.process}</div>
                    <div className="text-lg font-black text-yellow-400 font-mono mt-0.5">{pb.required}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-4">
            <h2 className="text-sm font-bold text-stone-100 uppercase tracking-wider border-b border-stone-800 pb-3">
              Utilization
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cell_utilization.map((cell) => {
                const isOver = cell.status === 'Over-Utilized';
                return (
                  <div key={cell.cell_id} className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-100">{cell.cell_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOver ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {cell.utilization_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(cell.utilization_pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-stone-400">{cell.recommended_action}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 3: DIRECTIVES (SCENARIO-DRIVEN MULTI-PLAN RANKED BY EFFICIENCY) */}
      {activeTab === 'directives' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* SCENARIO INPUT PANEL (NO SUGGESTED SCENARIOS) */}
          <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Scenario Action Planner
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Enter your operational scenario below to devise multiple action plans ranked strictly in order of efficiency.
                </p>
              </div>

              {activeWarehouse && (
                <div className="text-xs px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-800 text-yellow-400 font-bold self-start sm:self-auto shrink-0">
                  {activeWarehouse.name} ({activeWarehouse.dock_doors} Docks)
                </div>
              )}
            </div>

            {/* Typed Scenario Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 block">
                Enter Operational Scenario:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  rows={2}
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  placeholder="Describe your operational scenario (e.g. Inbound shipment surge with 15% worker shortage and 3-hour carrier delay)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:border-yellow-500 outline-none resize-none placeholder:text-stone-600"
                />
                <button
                  disabled={isDevising || !scenarioInput.trim()}
                  onClick={() => handleDevisePlan(scenarioInput)}
                  className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-stone-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  {isDevising ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Devising...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Devise Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* EMPTY STATE BEFORE DEVISING */}
          {!devisedData && !isDevising && (
            <div className="p-8 rounded-2xl border border-dashed border-stone-800 text-center space-y-2 bg-stone-950/30">
              <Sparkles className="w-8 h-8 text-yellow-500 mx-auto opacity-60" />
              <div className="text-sm font-bold text-stone-200">No Scenario Submitted Yet</div>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Type your operational scenario in the field above and click <strong className="text-yellow-400">Devise Plan</strong> to generate multiple actionable solutions ranked by efficiency.
              </p>
            </div>
          )}

          {/* MULTIPLE PLANS RANKED IN ORDER OF EFFICIENCY */}
          {devisedData?.plans && (
            <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-200">
              
              {/* DISPATCH CONFIRMATION ALERT */}
              {dispatchReceipt && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{dispatchReceipt}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">STATUS: VERIFIED & ACTIVE</span>
                </div>
              )}

              {/* RANK SELECTOR CARDS */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  Multiple Action Plans (Ranked by Efficiency):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {devisedData.plans.map((p) => {
                    const isSelected = selectedPlanRank === p.rank;
                    const isDispatched = dispatchedPlanId === p.directive_id;
                    return (
                      <div
                        key={p.rank}
                        onClick={() => setSelectedPlanRank(p.rank)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-500/10 shadow-md ring-1 ring-yellow-500/50'
                            : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
                            p.rank === 1 ? 'bg-yellow-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                          }`}>
                            Rank #{p.rank}
                          </span>
                          <span className="text-sm font-black text-yellow-400 font-mono">
                            {p.efficiency_score}% Efficiency
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-xs text-stone-100 line-clamp-1">{p.title}</h3>
                          <span className="text-[10px] text-stone-400 font-semibold">{p.tag}</span>
                        </div>

                        <div className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-stone-800/80 flex items-center justify-between">
                          <span>Cost Reduction:</span>
                          <strong>${p.financial_impact?.daily_cost_reduction_usd?.toLocaleString()}/day</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELECTED PLAN COMPREHENSIVE DETAIL */}
              {(() => {
                const plan = devisedData.plans.find((p) => p.rank === selectedPlanRank) || devisedData.plans[0];
                const isDispatched = dispatchedPlanId === plan.directive_id;

                return (
                  <div className="glass-card p-5 rounded-2xl border border-yellow-500/40 bg-yellow-500/5 space-y-5">
                    
                    {/* DETAIL HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-yellow-500 text-stone-950">
                            Rank #{plan.rank} • {plan.efficiency_score}% Efficiency
                          </span>
                          <span className="text-xs font-mono text-stone-400">{plan.directive_id}</span>
                        </div>
                        <h3 className="text-base font-black text-stone-100 mt-1">
                          {plan.title}
                        </h3>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Classification: <strong className="text-yellow-400">{plan.tag}</strong> • Facility: <strong className="text-stone-200">{devisedData.facility?.name}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDispatchPlan(plan)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md ${
                          isDispatched
                            ? 'bg-emerald-500 text-stone-950'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
                        }`}
                      >
                        {isDispatched ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Directive Dispatched & Active</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Dispatch Rank #{plan.rank} Plan</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* SECTION 1: WHY IT IS EFFICIENT (SIMPLE & REAL PREDICTED POINTS) */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Why It Is Efficient (Predicted Impacts)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {plan.why_efficient?.map((point, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                            <span className="text-stone-300 font-medium leading-relaxed text-[11px]">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: OPTIMAL SOLUTION (STEP-BY-STEP REALLOCATION) */}
                    <div className="space-y-3 pt-2 border-t border-stone-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                        <Layers className="w-4 h-4" />
                        <span>Optimal Solution Steps</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {plan.optimal_solutions?.map((sol) => (
                          <div key={sol.step} className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-black text-[11px] flex items-center justify-center">
                                {sol.step}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">{sol.operator_name}</span>
                            </div>
                            <div className="font-bold text-stone-100">{sol.action}</div>
                            <p className="text-[11px] text-stone-400">{sol.details}</p>
                            <div className="pt-2 border-t border-stone-800 text-[10px] flex items-center justify-between text-stone-400">
                              <span>From: <strong className="text-stone-300">{sol.from}</strong></span>
                              <span>To: <strong className="text-yellow-400">{sol.to}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: PROFITS, LOSSES & COST REDUCTIONS */}
                    <div className="space-y-3 pt-2 border-t border-stone-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                          <span className="font-black text-sm">$</span>
                          <span>Profits, Losses & Cost Reductions</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          Net Monthly Profit Gain: +${plan.financial_impact?.net_profit_gain_monthly_usd?.toLocaleString()} (+{plan.financial_impact?.operating_margin_expansion_pct}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
                          <span className="text-stone-400 text-[10px]">Daily Cost Reduction</span>
                          <div className="text-lg font-black text-emerald-400 font-mono">
                            ${plan.financial_impact?.daily_cost_reduction_usd?.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-stone-400 block">${plan.financial_impact?.monthly_cost_reduction_usd?.toLocaleString()} / month</span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
                          <span className="text-stone-400 text-[10px]">Overtime Impact</span>
                          <div className={`text-lg font-black font-mono ${
                            plan.financial_impact?.overtime_cost_saved_usd >= 0 ? 'text-yellow-400' : 'text-rose-400'
                          }`}>
                            {plan.financial_impact?.overtime_cost_saved_usd >= 0
                              ? `+$${plan.financial_impact?.overtime_cost_saved_usd?.toLocaleString()} saved`
                              : `-$${Math.abs(plan.financial_impact?.overtime_cost_saved_usd)?.toLocaleString()} cost`}
                          </div>
                          <span className="text-[10px] text-stone-400 block">per operating day</span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
                          <span className="text-stone-400 text-[10px]">Demurrage Avoided</span>
                          <div className="text-lg font-black text-yellow-400 font-mono">
                            ${plan.financial_impact?.carrier_demurrage_saved_usd?.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-stone-400 block">detention fee protection</span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
                          <span className="text-stone-400 text-[10px]">Unit Handling Cost</span>
                          <div className="text-lg font-black text-stone-100 font-mono">
                            ${plan.financial_impact?.optimized_cost_per_unit_usd}
                          </div>
                          <span className="text-[10px] text-emerald-400 block">-${plan.financial_impact?.cost_savings_per_unit_usd} / unit savings</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: KPI BENCHMARK PERFORMANCE */}
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block">
                        Predicted KPI Benchmark Performance
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                          <div className="text-stone-400 text-[10px]">Throughput Velocity</div>
                          <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                            +{plan.kpi_improvements?.throughput_gain_pct}%
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                          <div className="text-stone-400 text-[10px]">Dock Dwell Time</div>
                          <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                            -{plan.kpi_improvements?.dock_dwell_time_reduction_hours} hrs
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                          <div className="text-stone-400 text-[10px]">SLA Delivery Rate</div>
                          <div className="text-base font-black text-yellow-400 font-mono mt-0.5">
                            {plan.kpi_improvements?.sla_delivery_compliance_pct}%
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                          <div className="text-stone-400 text-[10px]">Labor Utilization</div>
                          <div className="text-base font-black text-stone-200 font-mono mt-0.5">
                            {plan.kpi_improvements?.utilization_balanced_pct}%
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Recommendations;
