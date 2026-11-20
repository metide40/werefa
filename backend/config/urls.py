from django.contrib import admin
from django.urls import path, include
from clinics.admin_views import (
    admin_overview, admin_clinics, admin_queues, admin_activity,
    admin_health, admin_clinic_detail,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/clinics/', include('clinics.urls')),
    path('api/queues/', include('queues.urls')),
    path('api/admin/overview/', admin_overview, name='admin-overview'),
    path('api/admin/clinics/', admin_clinics, name='admin-clinics'),
    path('api/admin/clinics/<int:pk>/', admin_clinic_detail, name='admin-clinic-detail'),
    path('api/admin/queues/', admin_queues, name='admin-queues'),
    path('api/admin/activity/', admin_activity, name='admin-activity'),
    path('api/admin/health/', admin_health, name='admin-health'),
]
