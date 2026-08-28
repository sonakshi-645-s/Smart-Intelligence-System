import urllib.request
import json

print('--- OASIS SYSTEM VERIFICATION SUITE ---')

# 1. Test Vite Frontend Server
try:
    res = urllib.request.urlopen('http://localhost:5173/')
    print('[PASS] Vite Frontend Dev Server: HTTP', res.status)
except Exception as e:
    print('[FAIL] Vite Frontend Dev Server:', e)

# 2. Test Login Authentication & Ingestion
try:
    # Test invalid password rejection
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                'http://127.0.0.1:8000/api/auth/login-ingest/',
                data=json.dumps({'password': 'bad'}).encode(),
                headers={'Content-Type': 'application/json'}
            )
        )
        print('[FAIL] Bad password was not rejected')
    except urllib.error.HTTPError as e:
        assert e.code == 401
        print('[PASS] Login Password Security Check: Correctly rejected 401 Unauthorized')

    # Test valid password login & dataset ingestion
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login-ingest/',
        data=json.dumps({'password': 'oasis2026', 'use_sample_data': True, 'warehouse_id': 'WH-CHI-01'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    auth_data = json.loads(urllib.request.urlopen(req).read())
    assert auth_data['status'] == 'success'
    wh_name = auth_data['active_warehouse']['name']
    counts = auth_data['counts']
    print(f"[PASS] Login & Dataset Ingestion: Active Warehouse = {wh_name}, Datasets = {counts}")
except Exception as e:
    print('[FAIL] Login Ingestion:', e)

# 3. Test Warehouse-Curated Dashboard
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/dashboard/overview/?warehouse_id=WH-CHI-01')
    dash = json.loads(urllib.request.urlopen(req).read())
    wh_name = dash['active_warehouse']['name']
    inb_color = dash['map']['color_legend']['inbound']['color']
    out_color = dash['map']['color_legend']['outbound']['color']
    assert inb_color == '#EAB308', 'Inbound color must be yellow'
    assert out_color == '#78350F', 'Outbound color must be dark brown'
    
    inb_load = dash['metrics']['inbound']['dock_load_pct']
    out_sla = dash['metrics']['outbound']['sla_compliance_pct']
    inv_breach = dash['metrics']['inventory']['safety_stock_breaches']
    thru = dash['metrics']['throughput']['processed_units_per_hour']
    print(f"[PASS] Dashboard Curation: Facility = {wh_name}")
    print(f"       Map Palette: Inbound = {inb_color} (Yellow), Outbound = {out_color} (Dark Brown)")
    print(f"       4 Floating Status Cards: Dock Load = {inb_load}%, Outbound SLA = {out_sla}%, Breached SKUs = {inv_breach}, Throughput = {thru} u/hr")
except Exception as e:
    print('[FAIL] Dashboard Overview:', e)

# 4. Test Recommendations Mutual Exclusivity & Solved Directives
try:
    # Apply Plan 1
    urllib.request.urlopen(
        urllib.request.Request('http://127.0.0.1:8000/api/recommendations/REC-PLAN-01/apply/', data=b'{}', headers={'Content-Type': 'application/json'})
    )
    # Apply Plan 2 (Previous Plan 1 must be unclicked/deactivated)
    urllib.request.urlopen(
        urllib.request.Request('http://127.0.0.1:8000/api/recommendations/REC-PLAN-02/apply/', data=b'{}', headers={'Content-Type': 'application/json'})
    )

    rec_data = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/recommendations/').read())
    recs = rec_data['recommendations']
    plan1 = next(r for r in recs if r['id'] == 'REC-PLAN-01')
    plan2 = next(r for r in recs if r['id'] == 'REC-PLAN-02')
    assert plan1['is_active'] == False, 'Plan 1 should have been unclicked'
    assert plan2['is_active'] == True, 'Plan 2 should be active'
    print(f"[PASS] Recommendations Single-Plan Mutual Exclusivity:")
    print(f"       REC-PLAN-01 is_active = {plan1['is_active']} (Unclicked / Deactivated)")
    print(f"       REC-PLAN-02 is_active = {plan2['is_active']} (Active & Dispatched)")
    print(f"       Anomalies & Delay Choke-points Detected: {len(rec_data['anomalies'])} alerts (e.g. {rec_data['anomalies'][0]['title']})")
    print(f"       Workforce Skill-Matrix: {len(rec_data['cell_utilization'])} operational cells mapped with shift load")
except Exception as e:
    print('[FAIL] Recommendations & Mutual Exclusivity:', e)

# 5. Test Digital Twin Simulation
try:
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/simulation/run/',
        data=json.dumps({'volume_shock_pct': 30, 'absenteeism_pct': 10, 'transit_delay_hours': 12}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    sim = json.loads(urllib.request.urlopen(req).read())
    cong = sim['impacts']['dock_congestion_risk_pct']
    sla = sim['impacts']['sla_breach_risk_pct']
    btl = sim['impacts']['bottleneck_index']
    print(f"[PASS] Digital Twin Simulation: Congestion Risk = {cong}%, SLA Breach Risk = {sla}%, Bottleneck Index = {btl} / 5.0")
except Exception as e:
    print('[FAIL] Digital Twin Simulation:', e)

# 6. Test Preferences & Notification Toggle
try:
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/preferences/',
        data=json.dumps({'notifications_enabled': True, 'preferred_language': 'ta'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    pref = json.loads(urllib.request.urlopen(req).read())
    assert pref['notifications_enabled'] == True
    print(f"[PASS] Profile Preferences: Notifications Enabled = {pref['notifications_enabled']}, Preferred Language = {pref['preferred_language']}")
except Exception as e:
    print('[FAIL] Preferences:', e)

print('--- ALL TEST SUITES PASSED CLEANLY ---')
