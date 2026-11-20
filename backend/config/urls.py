from django.contrib import admin
from django.urls import path, include
from triage.views import admin_emergencies
from clinics.admin_views import (
    admin_overview, admin_clinics, admin_queues, admin_activity,
    admin_health, admin_clinic_detail,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/clinics/', include('clinics.urls')),
    path('api/queues/', include('queues.urls')),
    path('api/triage/', include('triage.urls')),
    path('api/admin/overview/', admin_overview, name='admin-overview'),
    path('api/admin/clinics/', admin_clinics, name='admin-clinics'),
    path('api/admin/clinics/<int:pk>/', admin_clinic_detail, name='admin-clinic-detail'),
    path('api/admin/queues/', admin_queues, name='admin-queues'),
    path('api/admin/activity/', admin_activity, name='admin-activity'),
    path('api/admin/health/', admin_health, name='admin-health'),
    path('api/admin/emergencies/', admin_emergencies, name='admin-emergencies'),
]

# --- Single-service demo: serve React SPA for non-API routes ---
from django.http import FileResponse, Http404
from django.conf import settings as dj_settings
from pathlib import Path as _Path

def spa_index(request, path=''):
    """Serve index.html for client-side routes when frontend dist is present."""
    dist = getattr(dj_settings, 'FRONTEND_DIST', None)
    if not dist:
        raise Http404('Frontend not built')
    dist = _Path(dist)
    # Prefer exact file (assets), else index.html for SPA routing
    candidate = dist / path if path else dist / 'index.html'
    if path and candidate.is_file() and 'index.html' not in path:
        return FileResponse(candidate.open('rb'))
    index = dist / 'index.html'
    if index.is_file():
        return FileResponse(index.open('rb'), content_type='text/html')
    raise Http404('Frontend not built — run npm run build')

urlpatterns += [
    # Catch-all after API routes
    path('', spa_index, name='spa-root'),
    path('<path:path>', spa_index, name='spa'),
]
