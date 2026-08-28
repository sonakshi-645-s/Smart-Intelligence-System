import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, AlertTriangle, ArrowRight, DollarSign,
  Send, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../utils/api';

const StaffAllocationTool = ({ activeWarehouse }) => {
  // Fully typed inputs from the user
  const [taskName, setTaskName] = useState('Order Picking');
  const [volume, setVolume] = useState(10000);
  const [durationHours, setDurationHours] = useState(8);
  const [handlingRate, setHandlingRate] = useState(55); // units/hr/person
  const [availableStaff, setAvailableStaff] = useState(12);

  const [calculation, setCalculation] = useState(null);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Update available staff whenever activeWarehouse changes
  useEffect(() => {
    if (activeWarehouse?.dock_doors) {
      const facilityStaff = Math.max(4, Math.round(activeWarehouse.dock_doors * 0.65));
      setAvailableStaff(facilityStaff);
    }
  }, [activeWarehouse?.warehouse_id]);

  // Compute staffing directly from user's typed inputs
  useEffect(() => {
    const vol = Math.max(1, Number(volume) || 0);
    const dur = Math.max(0.5, Number(durationHours) || 1);
    const rate = Math.max(1, Number(handlingRate) || 50);
    const currStaff = Math.max(0, Number(availableStaff) || 0);

    const totalPersonHours = Math.round((vol / rate) * 10) / 10;
    const requiredHeadcount = Math.max(1, Math.ceil(totalPersonHours / dur));
    const deficit = Math.max(0, requiredHeadcount - currStaff);
    const surplus = Math.max(0, currStaff - requiredHeadcount);

    // Shift breakdown recommendations
    const morningStaff = Math.ceil(requiredHeadcount * 0.45);
    const eveningStaff = Math.ceil(requiredHeadcount * 0.35);
    const nightStaff = Math.max(1, requiredHeadcount - morningStaff - eveningStaff);

    // Estimated labor spend ($24/hr standard, $36/hr overtime if deficit)
    const baseCost = Math.round(totalPersonHours * 24.0);
    const overtimeHours = deficit > 0 ? Math.round(deficit * dur * 0.75) : 0;
    const overtimeCost = Math.round(overtimeHours * 36.0);
    const totalLaborCost = baseCost + overtimeCost;
    const costPerUnit = (totalLaborCost / vol).toFixed(2);

    setCalculation({
      task: taskName,
      requiredHeadcount,
      totalPersonHours,
      deficit,
      surplus,
      totalLaborCost,
      costPerUnit,
      shifts: [
        { name: 'Morning', hours: '06:00 - 14:00', count: morningStaff },
        { name: 'Evening', hours: '14:00 - 22:00', count: eveningStaff },
        { name: 'Night', hours: '22:00 - 06:00', count: nightStaff },
      ],
      isFeasible: deficit === 0,
    });
  }, [taskName, volume, durationHours, handlingRate, availableStaff]);

  const handleDeploy = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#EAB308', '#10B981'],
      });
    } catch (e) {}
    setDeploySuccess(true);
    setTimeout(() => setDeploySuccess(false), 3000);
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-stone-800 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div>
          <h2 className="text-base font-black text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            Staffing
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Type your task, volume, and target duration to calculate required staffing and shift allocations
          </p>
        </div>
      </div>

      {activeWarehouse && (
        <div className="flex items-center gap-2 text-xs text-stone-400 bg-stone-950/70 px-3 py-1.5 rounded-xl border border-stone-800">
          <span className="text-stone-400">Target Facility:</span>
          <strong className="text-yellow-400">{activeWarehouse.name} ({activeWarehouse.city})</strong>
          <span>•</span>
          <span>{activeWarehouse.dock_doors} Dock Doors</span>
        </div>
      )}

      {deploySuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Staffing plan dispatched to shift supervisors.</span>
        </div>
      )}

      {/* TYPED USER INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Input 1: Task */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-300 block">
            Task
          </label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Type task (e.g. Picking, Packing)"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-yellow-500"
          />
        </div>

        {/* Input 2: Volume */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-300 block">
            Volume (Units)
          </label>
          <input
            type="number"
            min="1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="e.g. 10000"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
          />
        </div>

        {/* Input 3: Duration */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-300 block">
            Duration (Hours)
          </label>
          <input
            type="number"
            min="1"
            max="72"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="e.g. 8"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
          />
        </div>

        {/* Input 4: Handling Rate */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-300 block">
            Rate (Units/Hour/Staff)
          </label>
          <input
            type="number"
            min="1"
            value={handlingRate}
            onChange={(e) => setHandlingRate(e.target.value)}
            placeholder="e.g. 55"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
          />
        </div>

        {/* Input 5: Current Available Staff */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-300 block">
            Available Staff
          </label>
          <input
            type="number"
            min="0"
            value={availableStaff}
            onChange={(e) => setAvailableStaff(e.target.value)}
            placeholder="e.g. 12"
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      {/* CALCULATED RESULTS */}
      {calculation && (
        <div className="space-y-4 pt-2 border-t border-stone-800">
          
          {/* Key Output Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 text-xs block">Required Staff</span>
              <div className="text-2xl font-black font-mono text-yellow-400 mt-1">
                {calculation.requiredHeadcount} <span className="text-xs text-stone-400 font-normal">staff</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 text-xs block">Person-Hours</span>
              <div className="text-2xl font-black font-mono text-stone-100 mt-1">
                {calculation.totalPersonHours} <span className="text-xs text-stone-400 font-normal">hrs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 text-xs block">Status</span>
              <div className={`text-sm font-black mt-2 flex items-center gap-1.5 ${
                calculation.deficit > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {calculation.deficit > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{calculation.deficit > 0 ? `Deficit (-${calculation.deficit})` : 'Fully Staffed'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-400 text-xs block">Labor Cost</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ${calculation.totalLaborCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-500 font-mono">${calculation.costPerUnit}/unit</span>
            </div>
          </div>

          {/* Shift Recommendations */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
              Shifts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {calculation.shifts.map((shift, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">{shift.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{shift.hours}</span>
                  </div>
                  <div className="text-lg font-black font-mono text-yellow-400">
                    {shift.count} <span className="text-xs text-stone-400 font-normal">staff</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleDeploy}
              className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deploy</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffAllocationTool;
