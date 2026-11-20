from django.contrib import admin
from .models import Clinic, Department

class DepartmentInline(admin.TabularInline):
    model = Department
    extra = 0

@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'region', 'clinic_type', 'is_active']
    inlines = [DepartmentInline]

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'clinic', 'is_active']
