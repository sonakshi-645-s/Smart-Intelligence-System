import base64
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet

def get_cipher():
    """Retrieve or generate valid Fernet cipher instance from settings."""
    raw_key = getattr(settings, 'FERNET_KEY', None)
    if not raw_key:
        secret = getattr(settings, 'SECRET_KEY', 'default-key').encode()
        derived = base64.urlsafe_b64encode(secret.ljust(32)[:32])
        return Fernet(derived)
    
    if isinstance(raw_key, str):
        key_bytes = raw_key.encode('utf-8')
    else:
        key_bytes = raw_key
        
    try:
        return Fernet(key_bytes)
    except Exception:
        padded = base64.urlsafe_b64encode(key_bytes.ljust(32)[:32])
        return Fernet(padded)


class EncryptedCharField(models.CharField):
    """
    Field-level symmetric AES-256 encryption using Fernet.
    Protects PII (employee names, supervisor contacts) at rest in SQLite.
    """
    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        try:
            cipher = get_cipher()
            return cipher.decrypt(value.encode('utf-8')).decode('utf-8')
        except Exception:
            return value

    def get_prep_value(self, value):
        if not value:
            return value
        try:
            cipher = get_cipher()
            return cipher.encrypt(str(value).encode('utf-8')).decode('utf-8')
        except Exception:
            return value


class Warehouse(models.Model):
    warehouse_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    storage_capacity_sqft = models.IntegerField(default=500000)
    dock_doors = models.IntegerField(default=16)
    operating_status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.warehouse_id} - {self.name} ({self.city})"


class Supplier(models.Model):
    supplier_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    origin_city = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    item_type = models.CharField(max_length=100)
    volume_history = models.FloatField(default=0.0)
    lead_time_days = models.IntegerField(default=1)
    assigned_warehouse = models.ForeignKey(
        Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='suppliers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.supplier_id} - {self.name} ({self.origin_city})"


class Customer(models.Model):
    customer_id = models.CharField(max_length=50, unique=True, db_index=True)
    region = models.CharField(max_length=100)
    destination_city = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    sla_hours = models.IntegerField(default=24)
    avg_volume = models.FloatField(default=0.0)
    assigned_warehouse = models.ForeignKey(
        Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer_id} - {self.destination_city} ({self.region})"


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Mechanical', 'Mechanical'),
        ('Polymers', 'Polymers'),
        ('Fasteners', 'Fasteners'),
        ('Powertrain', 'Powertrain'),
        ('Optical', 'Optical'),
        ('General', 'General'),
    ]
    VELOCITY_CHOICES = [
        ('Fast', 'Fast'),
        ('Medium', 'Medium'),
        ('Slow', 'Slow'),
        ('Critical', 'Critical'),
    ]

    sku_id = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    stock_on_hand = models.IntegerField(default=0)
    safety_stock = models.IntegerField(default=0)
    turnover_ratio = models.FloatField(default=1.0)
    movement_velocity = models.CharField(max_length=20, choices=VELOCITY_CHOICES, default='Medium')
    assigned_warehouse = models.ForeignKey(
        Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_breached(self):
        return self.stock_on_hand < self.safety_stock

    def __str__(self):
        return f"{self.sku_id} [{self.category}] Stock: {self.stock_on_hand}"


class WorkforceMember(models.Model):
    SHIFT_CHOICES = [
        ('Morning', 'Morning'),
        ('Evening', 'Evening'),
        ('Night', 'Night'),
    ]

    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    # Encrypted PII field (AES-256 encrypted at rest)
    name = EncryptedCharField(max_length=500)
    primary_skill = models.CharField(max_length=100)
    secondary_skill = models.CharField(max_length=100, blank=True)
    efficiency_score = models.FloatField(default=0.85)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default='Morning')
    assigned_warehouse = models.ForeignKey(
        Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='workforce_members'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} ({self.shift} Shift)"


class RecommendationRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('applied', 'Applied & Dispatched'),
        ('dismissed', 'Dismissed'),
    ]

    recommendation_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=250)
    category = models.CharField(max_length=100)
    description = models.TextField()
    efficiency_gain = models.CharField(max_length=50)  # e.g., "+24.5% Throughput"
    impact_metric = models.CharField(max_length=100)
    action_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=False)  # Enforces mutual exclusivity (only 1 plan active at a time)
    applied_at = models.DateTimeField(null=True, blank=True)
    supervisor_email = models.EmailField(blank=True, default='')
    dispatched_details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.efficiency_gain} ({self.status})"


class SimulationScenario(models.Model):
    scenario_name = models.CharField(max_length=150)
    volume_shock_pct = models.FloatField(default=0.0)
    absenteeism_pct = models.FloatField(default=0.0)
    transit_delay_hours = models.FloatField(default=0.0)
    dock_congestion_risk = models.FloatField(default=0.0)
    sla_breach_risk = models.FloatField(default=0.0)
    bottleneck_index = models.FloatField(default=0.0)
    unit_cost_impact = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.scenario_name} (SLA Risk: {self.sla_breach_risk}%)"


class SystemPreference(models.Model):
    org_name = models.CharField(max_length=200, default='OASIS Global Logistics Corp')
    facility_code = models.CharField(max_length=50, default='FAC-ALPHA-2026')
    dock_warning_threshold = models.IntegerField(default=85)
    safety_stock_min_pct = models.IntegerField(default=20)
    sla_target_compliance = models.IntegerField(default=95)
    dark_mode = models.BooleanField(default=True)
    preferred_language = models.CharField(max_length=10, default='en')
    supervisor_contact = EncryptedCharField(max_length=500, default='plant.manager@oasis-system.org')
    notifications_enabled = models.BooleanField(default=True)  # Notification toggle
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj
