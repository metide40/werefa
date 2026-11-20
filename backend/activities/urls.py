from django.urls import path
from .views import ActivityEventViewSet

urlpatterns = [
    path('events/', ActivityEventViewSet.as_view({'get': 'list'}), name='activity-list'),
]

from django.urls import path
from .views import ActivityEventViewSet

urlpatterns = [
    path('events/', ActivityEventViewSet.as_view({'get': 'list'}), name='activity-list'),
]
