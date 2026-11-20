from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (getattr(u, 'is_platform_admin', False) or u.role == 'ADMIN' or u.is_superuser))


class IsClinicStaff(BasePermission):
    """Clinic staff or triage nurse or admin."""
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.role in ('CLINIC_STAFF', 'TRIAGE_NURSE', 'ADMIN') or u.is_superuser


class IsTriageNurse(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.role in ('TRIAGE_NURSE', 'ADMIN') or u.is_superuser


class IsClinicStaffOnly(BasePermission):
    """Clinic operational staff (not triage-only)."""
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.role in ('CLINIC_STAFF', 'ADMIN') or u.is_superuser
