from django.contrib import admin
from django.urls import path, include
from clinics.admin_views import admin_overview
from clinics.views import admin_clinics

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/clinics/', include('clinics.urls')),
    path('api/queues/', include('queues.urls')),
    path('api/admin/overview/', admin_overview, name='admin-overview'),
    path('api/admin/clinics/', admin_clinics, name='admin-clinics'),
]
