def log_activity(*, event_type, message, actor=None, clinic=None, ticket=None, metadata=None):
    from .models import ActivityEvent
    user = actor if actor is not None and getattr(actor, 'is_authenticated', False) else None
    return ActivityEvent.objects.create(
        event_type=event_type,
        message=message,
        actor=user,
        clinic=clinic,
        ticket=ticket,
        metadata=metadata or {},
    )
