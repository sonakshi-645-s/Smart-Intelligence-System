from typing import Dict, List, Any
from .models import WorkforceMember, RecommendationRecord

OPERATIONAL_CELLS = [
    {
        'cell_id': 'CELL-INB',
        'name': 'Inbound Receiving & Unloading',
        'required_skill': 'Inbound Receiving',
        'base_demand': 140,
        'shift_demand': {'Morning': 60, 'Evening': 50, 'Night': 30},
    },
    {
        'cell_id': 'CELL-QC',
        'name': 'Quality Inspection & Sorting',
        'required_skill': 'Quality Inspection',
        'base_demand': 80,
        'shift_demand': {'Morning': 35, 'Evening': 30, 'Night': 15},
    },
    {
        'cell_id': 'CELL-FORK',
        'name': 'Forklift Staging & Put-away',
        'required_skill': 'Forklift Operations',
        'base_demand': 130,
        'shift_demand': {'Morning': 55, 'Evening': 45, 'Night': 30},
    },
    {
        'cell_id': 'CELL-PICK',
        'name': 'High-Velocity Order Picking',
        'required_skill': 'Order Picking',
        'base_demand': 150,
        'shift_demand': {'Morning': 65, 'Evening': 55, 'Night': 30},
    },
    {
        'cell_id': 'CELL-PACK',
        'name': 'Packing, Labelling & Sealing',
        'required_skill': 'Packing & Labelling',
        'base_demand': 110,
        'shift_demand': {'Morning': 50, 'Evening': 40, 'Night': 20},
    },
    {
        'cell_id': 'CELL-DISP',
        'name': 'Outbound Staging & Dispatch',
        'required_skill': 'Staging & Dispatch',
        'base_demand': 120,
        'shift_demand': {'Morning': 50, 'Evening': 45, 'Night': 25},
    },
]

def analyze_cell_utilization() -> List[Dict[str, Any]]:
    """
    Computes real-time capacity vs demand for operational cells based on active workforce.
    Identifies over-utilized and under-utilized operational areas.
    """
    workers = list(WorkforceMember.objects.all())
    cell_stats = []
    
    for cell in OPERATIONAL_CELLS:
        skill = cell['required_skill']
        primary_assigned = [w for w in workers if w.primary_skill == skill]
        secondary_capable = [w for w in workers if w.secondary_skill == skill]
        
        effective_capacity = sum(w.efficiency_score * 42 for w in primary_assigned)
        if effective_capacity == 0:
            effective_capacity = 35.0
            
        demand = cell['base_demand']
        utilization_pct = round((demand / effective_capacity) * 100, 1)
        
        status = 'Optimal'
        if utilization_pct > 115:
            status = 'Over-Utilized'
        elif utilization_pct < 75:
            status = 'Under-Utilized'
            
        cell_stats.append({
            'cell_id': cell['cell_id'],
            'cell_name': cell['name'],
            'required_skill': skill,
            'assigned_workers_count': len(primary_assigned),
            'secondary_candidates_count': len(secondary_capable),
            'capacity_units': round(effective_capacity, 1),
            'demand_units': demand,
            'utilization_pct': utilization_pct,
            'status': status,
            'shift_breakdown': cell['shift_demand'],
            'recommended_action': f"Reassign cross-skilled staff from surplus cells" if status == 'Over-Utilized' else "Surplus available for rebalancing" if status == 'Under-Utilized' else "Staffing balanced",
        })
        
    return cell_stats


def generate_smart_workforce_recommendations() -> List[Dict[str, Any]]:
    """
    Generates quantified problem-solved recommendations.
    Covers peak/non-peak planning, package delay mitigation, and proactive resource allocation.
    """
    # 5 High-Yield Solved Problem Action Plans
    plans = [
        {
            'recommendation_id': 'REC-PLAN-01',
            'title': 'Cross-Skill Dynamic Shift Redistribution (Peak Morning Surge)',
            'category': 'Workforce Redistribution & Shift Planning',
            'description': 'Inbound dock cell is operating at 132% capacity with a 3.2-hour truck waiting queue. Reassign 2 cross-certified operators from low-congestion Quality Inspection to Inbound Receiving for the morning peak shift.',
            'efficiency_gain': '+24.5% Throughput',
            'impact_metric': 'Eliminates 3.2 hrs truck dock dwell time & balances labor utilization',
            'action_type': 'WORKFORCE_REBALANCE',
            'scenario_type': 'Peak Morning Volume Shock',
            'addressed_issue': 'Sudden volume spikes & Inbound dock door bottleneck',
            'reassignments': [
                {
                    'worker_id': 'EMP-302',
                    'name': 'Elena Rostova',
                    'from_cell': 'Quality Inspection & Sorting (Under-Utilized: 68%)',
                    'to_cell': 'Inbound Receiving & Unloading (Over-Utilized: 132%)',
                    'match_skill': 'Secondary: Inbound Receiving (Efficiency: 0.91)',
                },
                {
                    'worker_id': 'EMP-313',
                    'name': 'Chloe Dubois',
                    'from_cell': 'Quality Inspection & Sorting (Under-Utilized: 68%)',
                    'to_cell': 'Inbound Receiving & Unloading (Over-Utilized: 132%)',
                    'match_skill': 'Secondary: Inbound Receiving (Efficiency: 0.92)',
                }
            ]
        },
        {
            'recommendation_id': 'REC-PLAN-02',
            'title': 'Outbound Staging & Package Delay Rerouting',
            'category': 'Package Delay & Route Mitigation',
            'description': 'Identified 34-minute package delay bottleneck at Pallet Staging Line 2. Re-allocate 1 staging forklift operator to high-cube buffer lane and split discharge conveyor traffic.',
            'efficiency_gain': '+18.2% Dock Velocity',
            'impact_metric': 'Resolves 34-min package dwell time and prevents outbound SLA breach',
            'action_type': 'PACKAGE_DELAY_MITIGATION',
            'scenario_type': 'Outbound Order Surge',
            'addressed_issue': 'Package delay at Zone B Staging Line 2',
            'reassignments': [
                {
                    'worker_id': 'EMP-303',
                    'name': 'Devin Zhao',
                    'from_cell': 'Standard Forklift Racking',
                    'to_cell': 'Zone B High-Cube Buffer Bay 4',
                    'match_skill': 'Primary: Forklift Operations (Efficiency: 0.88)',
                }
            ]
        },
        {
            'recommendation_id': 'REC-PLAN-03',
            'title': 'High-Velocity Pick Zone Pre-Kitting & Inventory Slotting',
            'category': 'Fulfillment Accuracy & Labor Planning',
            'description': 'SKU-5002 and SKU-5007 are driving 62% of pick-face requests. Pre-kit fast velocity bins adjacent to conveyor line A during non-peak hours to slash operator transit distance.',
            'efficiency_gain': '+14.8% Pick Rate',
            'impact_metric': 'Cuts order picking transit by 1.8 mins/order, improving cycle times',
            'action_type': 'INVENTORY_SLOTTING',
            'scenario_type': 'Non-Peak Proactive Pre-Kitting',
            'addressed_issue': 'Pick-face transit travel fatigue & slow order cycle times',
            'reassignments': [
                {
                    'worker_id': 'EMP-304',
                    'name': 'Priya Sharma',
                    'from_cell': 'Secondary Packing Cell',
                    'to_cell': 'Conveyor Line A Fast-Pick Zone',
                    'match_skill': 'Primary: Order Picking (Efficiency: 0.96)',
                }
            ]
        },
        {
            'recommendation_id': 'REC-PLAN-04',
            'title': 'Dual-Inspector Parallel Quality Gate Deployment',
            'category': 'Bottleneck Mitigation & Cycle Time',
            'description': 'Optical sensor batch inspection has accumulated an 18-batch backlog. Activate secondary ISO-9001 quality validation protocol with cross-trained inventory auditor.',
            'efficiency_gain': '+11.5% Cycle Time',
            'impact_metric': 'Clears 18 pending QC batches and accelerates raw material release to assembly',
            'action_type': 'QC_BOTTLENECK_CLEARANCE',
            'scenario_type': 'Batch Inspection Backlog',
            'addressed_issue': 'Optical sensor inspection delays at Inbound QC Gate',
            'reassignments': [
                {
                    'worker_id': 'EMP-307',
                    'name': "James O'Connor",
                    'from_cell': 'Inventory Audit (Under-Utilized)',
                    'to_cell': 'Quality Inspection Bay 1 (Backlog: 18 batches)',
                    'match_skill': 'Secondary: Quality Inspection (Efficiency: 0.89)',
                }
            ]
        },
        {
            'recommendation_id': 'REC-PLAN-05',
            'title': 'Night Shift Dynamic Resource Pre-Allocation',
            'category': 'Shift Planning & Proactive Resourcing',
            'description': 'Match forecasted early-morning freight arrival against night shift staging capacity. Transition 2 packaging workers to staging & put-away at 03:00 to prep bays for morning inbound.',
            'efficiency_gain': '+9.4% Capacity Utilization',
            'impact_metric': 'Ensures 100% ready bays before 07:00 AM supplier influx',
            'action_type': 'SHIFT_PLANNING',
            'scenario_type': 'Proactive Night-Shift Preparation',
            'addressed_issue': 'Unbalanced shift handoffs between Night and Morning shifts',
            'reassignments': [
                {
                    'worker_id': 'EMP-318',
                    'name': 'Tariq Nasser',
                    'from_cell': 'Night Shift Packaging',
                    'to_cell': 'Inbound Put-Away Staging',
                    'match_skill': 'Secondary: Forklift Operations (Efficiency: 0.82)',
                }
            ]
        },
    ]

    # Ensure records exist in database
    recommendations = []
    for plan in plans:
        rec, _ = RecommendationRecord.objects.get_or_create(
            recommendation_id=plan['recommendation_id'],
            defaults={
                'title': plan['title'],
                'category': plan['category'],
                'description': plan['description'],
                'efficiency_gain': plan['efficiency_gain'],
                'impact_metric': plan['impact_metric'],
                'action_type': plan['action_type'],
                'status': 'pending',
                'is_active': False,
            }
        )
        recommendations.append({
            'id': rec.recommendation_id,
            'db_id': rec.id,
            'title': rec.title,
            'category': rec.category,
            'description': rec.description,
            'efficiency_gain': rec.efficiency_gain,
            'impact_metric': rec.impact_metric,
            'action_type': rec.action_type,
            'scenario_type': plan['scenario_type'],
            'addressed_issue': plan['addressed_issue'],
            'status': rec.status,
            'is_active': rec.is_active,
            'applied_at': rec.applied_at,
            'reassignments': plan['reassignments'],
        })

    return recommendations
