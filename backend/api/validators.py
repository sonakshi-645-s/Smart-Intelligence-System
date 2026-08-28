import io
import csv
import re
from typing import Tuple, List, Dict, Any

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB

ALLOWED_EXTENSIONS = {'.csv'}
CSV_INJECTION_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

# Known global coordinates for automatic geocoding fallback
CITY_COORDINATES: Dict[str, Tuple[float, float]] = {
    'chicago': (41.8781, -87.6298),
    'dallas': (32.7767, -96.7970),
    'detroit': (42.3314, -83.0458),
    'phoenix': (33.4484, -112.0740),
    'monterrey': (25.6866, -100.3161),
    'toronto': (43.6532, -79.3832),
    'london': (51.5074, -0.1278),
    'frankfurt': (50.1109, 8.6821),
    'berlin': (52.5200, 13.4050),
    'paris': (48.8566, 2.3522),
    'rotterdam': (51.9244, 4.4777),
    'gothenburg': (57.7089, 11.9746),
    'tokyo': (35.6762, 139.6503),
    'kaohsiung': (22.6273, 120.3014),
    'seoul': (37.5665, 126.9780),
    'singapore': (1.3521, 103.8198),
    'mumbai': (19.0760, 72.8777),
    'bangalore': (12.9716, 77.5946),
    'chennai': (13.0827, 80.2707),
    'delhi': (28.7041, 77.1025),
    'hyderabad': (17.3850, 78.4867),
    'sydney': (-33.8688, 151.2093),
    'sao paulo': (-23.5505, -46.6333),
    'new york': (40.7128, -74.0060),
    'los angeles': (34.0522, -118.2437),
    'atlanta': (33.7490, -84.3880),
    'louisville': (38.2527, -85.7585),
    'memphis': (35.1495, -90.0490),
}

def get_city_coords(city_name: str, default_lat: float = 41.8781, default_lon: float = -87.6298) -> Tuple[float, float]:
    clean = str(city_name).strip().lower()
    for known_city, coords in CITY_COORDINATES.items():
        if known_city in clean or clean in known_city:
            return coords
    return (default_lat, default_lon)

def sanitize_csv_cell(value: Any) -> Any:
    """Neutralize formula injection while preserving numbers."""
    if isinstance(value, str):
        val = value.strip()
        if not val:
            return val
        try:
            float(val.replace(',', ''))
            return val.replace(',', '')
        except ValueError:
            pass

        if val.startswith(CSV_INJECTION_PREFIXES):
            val = "'" + val
        val = re.sub(r'<[^>]*>', '', val)
        return val
    return value

def validate_uploaded_file(file_obj) -> Tuple[bool, str]:
    if not file_obj:
        return False, "No file provided."
    if file_obj.size > MAX_FILE_SIZE_BYTES:
        return False, f"File exceeds size limit ({file_obj.size} bytes)."
    name = file_obj.name.lower()
    if not any(name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return False, f"Only .csv files authorized."
    try:
        content = file_obj.read()
        file_obj.seek(0)
        try:
            content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content.decode('latin-1')
            except Exception:
                return False, "Encoding error in CSV."
        return True, ""
    except Exception as e:
        return False, f"Read error: {e}"

def normalize_key(k: str) -> str:
    """Removes spaces, underscores, hyphens, and lowercases for forgiving matching."""
    return re.sub(r'[\s_\-]+', '', str(k).strip().lower())

def parse_and_sanitize_csv(file_obj) -> List[Dict[str, Any]]:
    content = file_obj.read()
    file_obj.seek(0)
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')

    buffer = io.StringIO(decoded)
    reader = csv.DictReader(buffer)
    
    rows = []
    for row in reader:
        norm_row = {}
        for key, val in row.items():
            if key:
                norm_row[normalize_key(key)] = sanitize_csv_cell(val)
        rows.append(norm_row)
    return rows

def find_field(row: Dict[str, Any], aliases: List[str], default=None):
    """Searches for normalized aliases in row."""
    for alias in aliases:
        norm = normalize_key(alias)
        if norm in row and row[norm] is not None and str(row[norm]).strip() != '':
            return row[norm]
    return default


# ==============================================================================
# SMART & FORGIVING SCHEMA VALIDATORS (ACCEPTS ANY STANDARD CSV FORMAT)
# ==============================================================================

def validate_suppliers_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Parses suppliers with flexible alias support:
    - ID: supplier_id, id, vendor_id, code
    - Name: name, supplier, supplier_name, vendor, company
    - Origin: origin_city, origin, city, location
    - Item: item_type, item, category, product
    - Volume: volume_history, volume, monthly_vol, units, quantity, qty
    - Lead time: lead_time_days, lead_time, days, lead
    - Lat/Lon: auto-derived from city if missing!
    """
    if not rows:
        return False, "CSV contains no data rows.", []
    
    validated = []
    for idx, r in enumerate(rows):
        s_id = find_field(r, ['supplier_id', 'id', 'supplierid', 'vendor_id', 'code', 's_id'], f"SUP-{idx+101}")
        name = find_field(r, ['name', 'supplier', 'supplier_name', 'vendor', 'vendor_name', 'company', 'partner'], f"Supplier {idx+1}")
        city = find_field(r, ['origin_city', 'origincity', 'origin', 'city', 'location', 'source', 'from'], 'Frankfurt')
        item = find_field(r, ['item_type', 'itemtype', 'item_category', 'category', 'item', 'product', 'material', 'type'], 'Industrial Components')
        
        raw_vol = find_field(r, ['volume_history', 'volume', 'monthly_vol', 'monthly_volume', 'units', 'quantity', 'qty'], 10000)
        raw_lead = find_field(r, ['lead_time_days', 'lead_time', 'leadtime', 'lead', 'days'], 5)

        try:
            vol = float(str(raw_vol).replace(',', ''))
        except (ValueError, TypeError):
            vol = 10000.0

        try:
            lead = max(1, int(float(str(raw_lead).replace(',', ''))))
        except (ValueError, TypeError):
            lead = 5

        # Geo-coordinates: from file or auto-geocoded from city
        raw_lat = find_field(r, ['latitude', 'lat'])
        raw_lon = find_field(r, ['longitude', 'lon', 'lng', 'long'])
        
        if raw_lat is not None and raw_lon is not None:
            try:
                lat = float(raw_lat)
                lon = float(raw_lon)
            except ValueError:
                lat, lon = get_city_coords(city)
        else:
            lat, lon = get_city_coords(city)

        validated.append({
            'supplier_id': str(s_id).strip(),
            'name': str(name).strip(),
            'origin_city': str(city).strip(),
            'latitude': lat,
            'longitude': lon,
            'item_type': str(item).strip(),
            'volume_history': vol,
            'lead_time_days': lead,
        })
    return True, "", validated


def validate_customers_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Parses customers with flexible alias support:
    - ID: customer_id, id, client_id, code
    - Region: region, country, zone, area (defaults to Global)
    - Destination: destination_city, destination, city, dest, to
    - SLA: sla_hours, sla, hours, lead_time
    - Volume: avg_volume, volume, orders, quantity, qty
    - Lat/Lon: auto-derived from destination city if missing!
    """
    if not rows:
        return False, "CSV contains no data rows.", []

    validated = []
    for idx, r in enumerate(rows):
        c_id = find_field(r, ['customer_id', 'id', 'customerid', 'client_id', 'code', 'c_id'], f"CUST-{idx+201}")
        region = find_field(r, ['region', 'zone', 'country', 'area', 'continent'], 'North America')
        city = find_field(r, ['destination_city', 'destinationcity', 'destination', 'city', 'dest', 'to'], 'Chicago')
        
        raw_sla = find_field(r, ['sla_hours', 'slahours', 'sla', 'hours', 'tat'], 24)
        raw_vol = find_field(r, ['avg_volume', 'avgvolume', 'volume', 'orders', 'monthly_vol', 'demand', 'qty'], 12000)

        try:
            sla = max(1, int(float(str(raw_sla).replace(',', ''))))
        except (ValueError, TypeError):
            sla = 24

        try:
            vol = float(str(raw_vol).replace(',', ''))
        except (ValueError, TypeError):
            vol = 12000.0

        raw_lat = find_field(r, ['latitude', 'lat'])
        raw_lon = find_field(r, ['longitude', 'lon', 'lng', 'long'])
        if raw_lat is not None and raw_lon is not None:
            try:
                lat = float(raw_lat)
                lon = float(raw_lon)
            except ValueError:
                lat, lon = get_city_coords(city)
        else:
            lat, lon = get_city_coords(city)

        validated.append({
            'customer_id': str(c_id).strip(),
            'region': str(region).strip(),
            'destination_city': str(city).strip(),
            'latitude': lat,
            'longitude': lon,
            'sla_hours': sla,
            'avg_volume': vol,
        })
    return True, "", validated


def validate_inventory_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Parses inventory with flexible alias support:
    - SKU: sku_id, sku, id, part_number, item_code
    - Category: category, type, group, item_type
    - Stock: stock_on_hand, stock, quantity, qty, on_hand, units
    - Safety: safety_stock, safety, buffer, min_stock, threshold
    - Turnover: turnover_ratio, turnover, ratio, turns
    - Velocity: movement_velocity, velocity, speed, tier
    """
    if not rows:
        return False, "CSV contains no data rows.", []

    validated = []
    for idx, r in enumerate(rows):
        sku = find_field(r, ['sku_id', 'skuid', 'sku', 'id', 'item_code', 'code', 'part_number'], f"SKU-{idx+5001}")
        cat = find_field(r, ['category', 'cat', 'type', 'item_type', 'group', 'class'], 'General Goods')
        
        raw_stock = find_field(r, ['stock_on_hand', 'stockonhand', 'stock', 'quantity', 'qty', 'on_hand', 'units'], 2000)
        raw_safety = find_field(r, ['safety_stock', 'safetystock', 'safety', 'buffer', 'min_stock'], 1000)
        raw_turnover = find_field(r, ['turnover_ratio', 'turnover', 'ratio', 'turns'], 5.0)
        velocity = str(find_field(r, ['movement_velocity', 'velocity', 'tier', 'speed'], 'Medium')).capitalize()

        try:
            stock = max(0, int(float(str(raw_stock).replace(',', ''))))
        except (ValueError, TypeError):
            stock = 2000

        try:
            safety = max(0, int(float(str(raw_safety).replace(',', ''))))
        except (ValueError, TypeError):
            safety = 1000

        try:
            turnover = max(0.1, float(str(raw_turnover).replace(',', '')))
        except (ValueError, TypeError):
            turnover = 5.0

        if velocity not in {'Fast', 'Medium', 'Slow', 'Critical'}:
            velocity = 'Fast' if turnover >= 8.0 else 'Medium' if turnover >= 4.0 else 'Slow'

        validated.append({
            'sku_id': str(sku).strip(),
            'category': str(cat).strip(),
            'stock_on_hand': stock,
            'safety_stock': safety,
            'turnover_ratio': turnover,
            'movement_velocity': velocity,
        })
    return True, "", validated


def validate_workforce_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Parses workforce members with flexible alias support:
    - ID: employee_id, emp_id, id, worker_id, staff_id
    - Name: name, employee_name, worker_name, staff, operator
    - Primary Skill: primary_skill, skill, role, designation
    - Secondary Skill: secondary_skill, cross_skill, alternate_skill
    - Efficiency: efficiency_score, efficiency, score, rating (accepts 0-1 or 0-100%)
    - Shift: shift, timing, work_shift (Morning, Evening, Night)
    """
    if not rows:
        return False, "CSV contains no data rows.", []

    validated = []
    default_skills = ['Inbound Receiving', 'Forklift Operations', 'Quality Inspection', 'Order Picking', 'Packing & Labelling', 'Staging & Dispatch']
    shifts = ['Morning', 'Evening', 'Night']

    for idx, r in enumerate(rows):
        emp_id = find_field(r, ['employee_id', 'employeeid', 'emp_id', 'id', 'worker_id', 'staff_id'], f"EMP-{idx+301}")
        name = find_field(r, ['name', 'employee_name', 'worker_name', 'staff', 'operator'], f"Logistics Operator {idx+1}")
        prim = find_field(r, ['primary_skill', 'primaryskill', 'skill', 'role', 'designation'], default_skills[idx % len(default_skills)])
        sec = find_field(r, ['secondary_skill', 'secondaryskill', 'cross_skill', 'alternate_skill'], default_skills[(idx + 1) % len(default_skills)])
        
        raw_eff = find_field(r, ['efficiency_score', 'efficiencyscore', 'efficiency', 'score', 'rating'], 0.90)
        shift_val = str(find_field(r, ['shift', 'timing', 'work_shift'], shifts[idx % len(shifts)])).strip().capitalize()

        try:
            eff = float(str(raw_eff).replace('%', '').replace(',', ''))
            if eff > 1.0:
                eff = eff / 100.0  # Converted 92% -> 0.92
            eff = min(1.0, max(0.5, eff))
        except (ValueError, TypeError):
            eff = 0.90

        if shift_val not in {'Morning', 'Evening', 'Night'}:
            shift_val = 'Morning' if 'morn' in shift_val.lower() else 'Evening' if 'even' in shift_val.lower() else 'Night'

        validated.append({
            'employee_id': str(emp_id).strip(),
            'name': str(name).strip(),
            'primary_skill': str(prim).strip(),
            'secondary_skill': str(sec).strip(),
            'efficiency_score': round(eff, 2),
            'shift': shift_val,
        })
    return True, "", validated


def validate_warehouses_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Parses warehouse facilities with flexible alias support.
    """
    if not rows:
        return False, "CSV contains no data rows.", []

    validated = []
    for idx, r in enumerate(rows):
        wh_id = find_field(r, ['warehouse_id', 'id', 'facility_id', 'code'], f"WH-{idx+101}")
        name = find_field(r, ['name', 'warehouse_name', 'facility_name', 'facility', 'hub'], f"Regional Hub {idx+1}")
        city = find_field(r, ['city', 'location'], 'Chicago')
        
        door_presets = [48, 32, 44, 22, 26, 36, 16, 28, 38, 20]
        cap_presets = [1250000, 850000, 1100000, 580000, 650000, 920000, 420000, 740000, 980000, 510000]
        raw_cap = find_field(r, ['storage_capacity_sqft', 'capacity', 'sqft', 'size'], cap_presets[idx % len(cap_presets)])
        raw_docks = find_field(r, ['dock_doors', 'docks', 'doors', 'bays'], door_presets[idx % len(door_presets)])
        status_val = str(find_field(r, ['operating_status', 'status'], 'Active')).strip()

        try:
            cap = int(float(str(raw_cap).replace(',', '')))
        except (ValueError, TypeError):
            cap = cap_presets[idx % len(cap_presets)]

        try:
            docks = max(4, int(float(str(raw_docks).replace(',', ''))))
        except (ValueError, TypeError):
            docks = door_presets[idx % len(door_presets)]

        raw_lat = find_field(r, ['latitude', 'lat'])
        raw_lon = find_field(r, ['longitude', 'lon', 'lng', 'long'])
        if raw_lat is not None and raw_lon is not None:
            try:
                lat = float(raw_lat)
                lon = float(raw_lon)
            except ValueError:
                lat, lon = get_city_coords(city)
        else:
            lat, lon = get_city_coords(city)

        validated.append({
            'warehouse_id': str(wh_id).strip(),
            'name': str(name).strip(),
            'city': str(city).strip(),
            'latitude': lat,
            'longitude': lon,
            'storage_capacity_sqft': cap,
            'dock_doors': docks,
            'operating_status': status_val or 'Active',
        })
    return True, "", validated
