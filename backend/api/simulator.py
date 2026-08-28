import numpy as np
from typing import Dict, Any

def run_digital_twin_simulation(
    volume_shock_pct: float = 0.0,
    absenteeism_pct: float = 0.0,
    transit_delay_hours: float = 0.0,
) -> Dict[str, Any]:
    """
    Digital Twin physics and queueing simulation model.
    Models the interaction of:
      - volume_shock_pct: [-50% to +100%]
      - absenteeism_pct: [0% to 50%]
      - transit_delay_hours: [0 to 72 hours]
    Computes immediate operational impacts:
      - Dock Congestion Risk %
      - Outbound SLA Breach Risk %
      - Warehouse Bottleneck Index (1.0 to 5.0)
      - Unit Processing Cost ($ / unit)
      - 24-hour hour-by-hour impact curve
    """
    # Clamp inputs
    vol = max(-50.0, min(100.0, float(volume_shock_pct)))
    absent = max(0.0, min(50.0, float(absenteeism_pct)))
    delay = max(0.0, min(72.0, float(transit_delay_hours)))
    
    # 1. Dock Congestion Risk % (Baseline 34%)
    # Higher volume shock and absenteeism compound dock congestion non-linearly
    base_congestion = 34.0
    vol_factor = (vol / 100.0) * 45.0
    absent_factor = (absent / 50.0) * 35.0
    delay_factor = (delay / 72.0) * 15.0
    
    dock_congestion = round(min(98.5, max(8.0, base_congestion + vol_factor + absent_factor - (delay_factor * 0.3))), 1)
    
    # 2. SLA Breach Risk % (Baseline 12%)
    # Transit delay and volume surge heavily increase SLA breach probability
    base_sla_risk = 12.0
    sla_vol_factor = max(0.0, vol * 0.35)
    sla_absent_factor = absent * 0.60
    sla_delay_factor = (delay / 24.0) * 22.0
    
    sla_breach_risk = round(min(99.0, max(2.5, base_sla_risk + sla_vol_factor + sla_absent_factor + sla_delay_factor)), 1)
    
    # 3. Warehouse Bottleneck Index [1.0 (Smooth) -> 5.0 (Critical Gridlock)]
    bottleneck_score = 1.6 + (dock_congestion / 100.0) * 2.1 + (sla_breach_risk / 100.0) * 1.3
    bottleneck_index = round(min(5.0, max(1.0, bottleneck_score)), 2)
    
    # Bottleneck Level Label
    if bottleneck_index >= 4.0:
        bottleneck_status = 'CRITICAL SEVERITY (Gridlock Imminent)'
        bottleneck_color = '#EF4444'
    elif bottleneck_index >= 2.8:
        bottleneck_status = 'ELEVATED STRESS (Backlog Accumulating)'
        bottleneck_color = '#F59E0B'
    else:
        bottleneck_status = 'NOMINAL STABILITY (Fluid Operations)'
        bottleneck_color = '#10B981'
        
    # 4. Projected Unit Cost Impact (Baseline $4.20 / unit processed)
    # Overtime costs + demurrage + delay penalties
    overtime_multiplier = 1.0 + (absent / 50.0) * 0.45 + max(0.0, vol / 100.0) * 0.30
    delay_penalty = (delay / 24.0) * 0.85
    unit_cost = round(4.20 * overtime_multiplier + delay_penalty, 2)
    cost_delta_pct = round(((unit_cost - 4.20) / 4.20) * 100, 1)
    
    # 5. 24-Hour Projected Trajectory Curve (Queue & Throughput)
    hourly_projections = []
    base_flow = 420
    for hour in range(24):
        time_label = f"{hour:02d}:00"
        # diurnal pattern peaking at 11:00 and 15:00
        cycle = np.sin((hour - 6) / 3.8)
        flow = base_flow * (1.0 + (vol / 100.0) * 0.5) * (1.0 - (absent / 100.0) * 0.6) * max(0.4, 0.9 + 0.3 * cycle)
        # queue accumulates when flow exceeds handling capacity (nominal 450)
        effective_capacity = 450 * (1.0 - (absent / 100.0) * 0.85)
        queue_units = max(0, int((flow - effective_capacity) * 2.5 + (delay * 4)))
        
        hourly_projections.append({
            'hour': time_label,
            'processed_flow': int(max(50, flow)),
            'queue_backlog': int(queue_units),
            'capacity_limit': int(effective_capacity),
        })
        
    return {
        'parameters': {
            'volume_shock_pct': vol,
            'absenteeism_pct': absent,
            'transit_delay_hours': delay,
        },
        'impacts': {
            'dock_congestion_risk_pct': dock_congestion,
            'sla_breach_risk_pct': sla_breach_risk,
            'bottleneck_index': bottleneck_index,
            'bottleneck_status': bottleneck_status,
            'bottleneck_color': bottleneck_color,
            'projected_unit_cost': unit_cost,
            'cost_delta_pct': cost_delta_pct,
        },
        'mitigation_recommendations': [
            f"Activate secondary cross-dock staging area if volume exceeds +{vol}%." if vol > 20 else "Maintain current dock door scheduling.",
            f"Authorize 2.5 hrs emergency overtime for Evening shift to cover {absent}% absenteeism." if absent > 10 else "Standard shift staffing is sufficient.",
            f"Re-route critical air freight priority for orders affected by {delay}hr transit delay." if delay > 12 else "Buffer stock handles transit variance.",
        ],
        'timeline': hourly_projections,
    }
