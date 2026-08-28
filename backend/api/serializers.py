from rest_framework import serializers
from .models import (
    Warehouse,
    Supplier,
    Customer,
    InventoryItem,
    WorkforceMember,
    RecommendationRecord,
    SimulationScenario,
    SystemPreference,
)

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class InventoryItemSerializer(serializers.ModelSerializer):
    is_breached = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = '__all__'


class WorkforceMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkforceMember
        fields = '__all__'


class RecommendationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationRecord
        fields = '__all__'


class SimulationScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulationScenario
        fields = '__all__'


class SystemPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPreference
        fields = '__all__'
