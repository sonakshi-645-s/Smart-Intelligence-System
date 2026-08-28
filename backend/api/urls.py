from django.urls import path
from .views import (
    UserLoginView,
    UserRegisterIngestView,
    DatasetUploadView,
    LoginAuthIngestionView,
    WarehouseListView,
    WarehouseComparisonView,
    DashboardOverviewView,
    MetricDrilldownView,
    SeedSampleDataView,
    RecommendationsView,
    ApplyRecommendationView,
    DigitalTwinSimulationView,
    VoiceAssistantQueryView,
    SystemPreferencesView,
)

urlpatterns = [
    # Auth Endpoints (Login for existing users, Register & Ingest for new users)
    path('auth/login/', UserLoginView.as_view(), name='auth-login'),
    path('auth/register/', UserRegisterIngestView.as_view(), name='auth-register'),
    path('auth/login-ingest/', UserLoginView.as_view(), name='login-ingest'),

    # Dataset Ingestion & Refresh (Profile page & onboarding)
    path('datasets/upload/', DatasetUploadView.as_view(), name='datasets-upload'),
    path('ingest/', DatasetUploadView.as_view(), name='dataset-ingest'),
    path('seed-sample-data/', SeedSampleDataView.as_view(), name='seed-sample-data'),

    # Facilities & Comparative Analytics
    path('warehouses/', WarehouseListView.as_view(), name='warehouses-list'),
    path('warehouses/compare/', WarehouseComparisonView.as_view(), name='warehouses-compare'),

    # Dashboard & Drilldowns
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('dashboard/drilldown/<str:metric_type>/', MetricDrilldownView.as_view(), name='metric-drilldown'),
    
    # Recommendations & Solver
    path('recommendations/', RecommendationsView.as_view(), name='recommendations-list'),
    path('recommendations/<str:rec_id>/apply/', ApplyRecommendationView.as_view(), name='recommendation-apply'),
    
    # Digital Twin Simulation
    path('simulation/run/', DigitalTwinSimulationView.as_view(), name='simulation-run'),
    
    # Voice & Multilingual NLU Assistant
    path('assistant/query/', VoiceAssistantQueryView.as_view(), name='assistant-query'),
    
    # System Preferences & Thresholds
    path('preferences/', SystemPreferencesView.as_view(), name='system-preferences'),
]
