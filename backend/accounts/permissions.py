from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (getattr(u, 'is_platform_admin', False) or u.is_superuser))


class IsClinicStaff(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (
            getattr(u, 'is_clinic_staff', False) or getattr(u, 'is_platform_admin', False) or u.is_superuser
        ))


class IsPatientOrStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
