from django.urls import path
from . import views

urlpatterns = [
    path('join/', views.join_queue, name='queue-join'),
    path('my-tickets/', views.my_tickets, name='queue-my-tickets'),
    path('tickets/<int:pk>/', views.ticket_detail, name='queue-ticket-detail'),
    path('tickets/<int:pk>/position/', views.ticket_position, name='queue-ticket-position'),
    path('tickets/<int:pk>/cancel/', views.cancel_ticket, name='queue-ticket-cancel'),
    path('clinic/', views.clinic_queue, name='queue-clinic'),
    path('clinic/overview/', views.clinic_overview, name='queue-clinic-overview'),
    path('clinic/call-next/', views.call_next, name='queue-call-next'),
    path('clinic/<int:pk>/complete/', views.complete_ticket, name='queue-complete'),
    path('clinic/<int:pk>/no-show/', views.no_show_ticket, name='queue-no-show'),
    path('clinic/<int:pk>/priority/', views.update_priority, name='queue-priority'),
]
