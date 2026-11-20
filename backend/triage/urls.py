from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.triage_overview, name='triage-overview'),
    path('pending/', views.triage_pending, name='triage-pending'),
    path('assessments/', views.create_assessment, name='triage-assess-create'),
    path('assessments/list/', views.list_assessments, name='triage-assess-list'),
    path('emergencies/', views.list_emergencies, name='triage-emergencies'),
    path('emergencies/<int:pk>/acknowledge/', views.acknowledge_emergency_view, name='triage-emergency-ack'),
    path('emergencies/<int:pk>/status/', views.emergency_status_view, name='triage-emergency-status'),
]
