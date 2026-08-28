import io
import csv
import re
from typing import Tuple, List, Dict, Any

# Maximum file size: 15MB
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

# Allowed MIME types and extensions
ALLOWED_EXTENSIONS = {'.csv'}
ALLOWED_MIME_TYPES = {
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/octet-stream',
}

# CSV Formula Injection trigger characters
CSV_INJECTION_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

def sanitize_csv_cell(value: Any) -> Any:
    """
    Neutralize CSV Formula / Macro Injection attacks.
    If text starts with =, +, -, @, tab, or carriage return, prepend apostrophe
    to prevent execution in Excel / Google Sheets / BI viewers.
    Safe numeric values (such as negative coordinates or deficits) are preserved.
    """
    if isinstance(value, str):
        val = value.strip()
        if not val:
            return val
        # Check if valid pure numeric value (including negative numbers)
        try:
            float(val)
            return val
        except ValueError:
            pass

        if val.startswith(CSV_INJECTION_PREFIXES):
            val = "'" + val
        val = re.sub(r'<[^>]*>', '', val)
        return val
    return value

def validate_uploaded_file(file_obj) -> Tuple[bool, str]:
    """Validates file size, extension, and content in memory."""
    if not file_obj:
        return False, "No file provided."

    if file_obj.size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds 15MB limit ({file_obj.size} bytes)."

    name = file_obj.name.lower()
    if not any(name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return False, f"Invalid file extension. Only .csv files are authorized."

    try:
        content = file_obj.read()
        file_obj.seek(0)
        try:
            content_str = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content_str = content.decode('latin-1')
            except Exception:
                return False, "File is not valid text/csv format (encoding error)."
                
        if not content_str.strip():
            return False, "CSV file is empty."
            
        return True, ""
    except Exception as e:
        return False, f"File read error: {str(e)}"


def parse_and_sanitize_csv(file_obj) -> List[Dict[str, Any]]:
    """Parses CSV in memory using io.StringIO, sanitizes cells against injection."""
    content = file_obj.read()
    file_obj.seek(0)
    
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')

    buffer = io.StringIO(decoded)
    reader = csv.DictReader(buffer)
    
    sanitized_rows = []
    for row in reader:
        sanitized_row = {}
        for key, val in row.items():
            clean_key = key.strip().lower() if key else ''
            sanitized_row[clean_key] = sanitize_csv_cell(val)
        sanitized_rows.append(sanitized_row)
        
    return sanitized_rows


# ==============================================================================
# SCHEMA VERIFIERS & BOUNDS CHECKERS
# ==============================================================================

def validate_warehouses_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """Validates warehouses schema and lat/long bounds."""
    required = {'warehouse_id', 'name', 'city', 'latitude', 'longitude'}
    validated = []
    
    for idx, r in enumerate(rows):
        if not required.issubset(r.keys()):
            return False, f"Row {idx+1} missing required warehouse columns: {required - set(r.keys())}", []
            
        try:
            lat = float(r['latitude'])
            lon = float(r['longitude'])
            capacity = int(float(r.get('storage_capacity_sqft', 500000) or 500000))
            docks = int(float(r.get('dock_doors', 16) or 16))
            status_val = str(r.get('operating_status', 'Active')).strip()
        except ValueError as e:
            return False, f"Row {idx+1} invalid numerical types: {str(e)}", []
            
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return False, f"Row {idx+1} latitude/longitude out of geographic bounds.", []

        validated.append({
            'warehouse_id': str(r['warehouse_id']).strip(),
            'name': str(r['name']).strip(),
            'city': str(r['city']).strip(),
            'latitude': lat,
            'longitude': lon,
            'storage_capacity_sqft': capacity,
            'dock_doors': docks,
            'operating_status': status_val or 'Active',
        })
    return True, "", validated


def validate_suppliers_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """Validates suppliers schema and lat/long bounds."""
    required = {'supplier_id', 'name', 'origin_city', 'latitude', 'longitude', 'item_type'}
    validated = []
    
    for idx, r in enumerate(rows):
        if not required.issubset(r.keys()):
            return False, f"Row {idx+1} missing required supplier columns: {required - set(r.keys())}", []
        
        try:
            lat = float(r['latitude'])
            lon = float(r['longitude'])
            vol = float(r.get('volume_history', 0.0) or 0.0)
            lead = int(r.get('lead_time_days', 1) or 1)
        except ValueError as e:
            return False, f"Row {idx+1} has invalid numerical types: {str(e)}", []
            
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return False, f"Row {idx+1} latitude/longitude out of geographic bounds.", []
        if vol < 0 or lead < 0:
            return False, f"Row {idx+1} negative volume or lead time detected.", []

        validated.append({
            'supplier_id': str(r['supplier_id']).strip(),
            'name': str(r['name']).strip(),
            'origin_city': str(r['origin_city']).strip(),
            'latitude': lat,
            'longitude': lon,
            'item_type': str(r['item_type']).strip(),
            'volume_history': vol,
            'lead_time_days': lead,
        })
    return True, "", validated


def validate_customers_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """Validates customers schema and bounds."""
    required = {'customer_id', 'region', 'destination_city', 'latitude', 'longitude', 'sla_hours'}
    validated = []
    
    for idx, r in enumerate(rows):
        if not required.issubset(r.keys()):
            return False, f"Row {idx+1} missing customer columns: {required - set(r.keys())}", []
            
        try:
            lat = float(r['latitude'])
            lon = float(r['longitude'])
            sla = int(r['sla_hours'])
            avg_vol = float(r.get('avg_volume', 0.0) or 0.0)
        except ValueError as e:
            return False, f"Row {idx+1} invalid numerical types: {str(e)}", []
            
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return False, f"Row {idx+1} latitude/longitude out of geographic bounds.", []
        if sla <= 0:
            return False, f"Row {idx+1} SLA hours must be positive integer.", []

        validated.append({
            'customer_id': str(r['customer_id']).strip(),
            'region': str(r['region']).strip(),
            'destination_city': str(r['destination_city']).strip(),
            'latitude': lat,
            'longitude': lon,
            'sla_hours': sla,
            'avg_volume': avg_vol,
        })
    return True, "", validated


def validate_inventory_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """Validates inventory schema and non-negative integers."""
    required = {'sku_id', 'category', 'stock_on_hand', 'safety_stock'}
    validated = []
    
    for idx, r in enumerate(rows):
        if not required.issubset(r.keys()):
            return False, f"Row {idx+1} missing inventory columns: {required - set(r.keys())}", []
            
        try:
            stock = int(float(r['stock_on_hand']))
            safety = int(float(r['safety_stock']))
            turnover = float(r.get('turnover_ratio', 1.0) or 1.0)
            velocity = str(r.get('movement_velocity', 'Medium')).capitalize()
        except ValueError as e:
            return False, f"Row {idx+1} invalid inventory numbers: {str(e)}", []
            
        if stock < 0 or safety < 0:
            return False, f"Row {idx+1} negative stock numbers not allowed.", []
            
        if velocity not in {'Fast', 'Medium', 'Slow', 'Critical'}:
            velocity = 'Medium'

        validated.append({
            'sku_id': str(r['sku_id']).strip(),
            'category': str(r['category']).strip(),
            'stock_on_hand': stock,
            'safety_stock': safety,
            'turnover_ratio': turnover,
            'movement_velocity': velocity,
        })
    return True, "", validated


def validate_workforce_schema(rows: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """Validates workforce schema, shifts, and efficiency score [0.0, 1.0]."""
    required = {'employee_id', 'name', 'primary_skill', 'efficiency_score', 'shift'}
    validated = []
    valid_shifts = {'morning', 'evening', 'night'}
    
    for idx, r in enumerate(rows):
        if not required.issubset(r.keys()):
            return False, f"Row {idx+1} missing workforce columns: {required - set(r.keys())}", []
            
        try:
            eff = float(r['efficiency_score'])
            shift_raw = str(r['shift']).strip().lower()
        except ValueError as e:
            return False, f"Row {idx+1} invalid efficiency score format: {str(e)}", []
            
        if not (0.0 <= eff <= 1.0):
            return False, f"Row {idx+1} efficiency score must be between 0.0 and 1.0.", []
            
        if shift_raw not in valid_shifts:
            return False, f"Row {idx+1} invalid shift '{r['shift']}'. Allowed: Morning, Evening, Night.", []

        validated.append({
            'employee_id': str(r['employee_id']).strip(),
            'name': str(r['name']).strip(),
            'primary_skill': str(r['primary_skill']).strip(),
            'secondary_skill': str(r.get('secondary_skill', '')).strip(),
            'efficiency_score': eff,
            'shift': shift_raw.capitalize(),
        })
    return True, "", validated
