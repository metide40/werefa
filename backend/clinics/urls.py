from django.urls import path
from . import views

urlpatterns = [
    path('', views.clinic_list, name='clinic-list'),
    path('<int:pk>/', views.clinic_detail, name='clinic-detail'),
    path('<int:pk>/departments/', views.clinic_departments, name='clinic-departments'),
]
