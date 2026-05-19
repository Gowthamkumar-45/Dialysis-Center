from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict

from .middleware import get_current_user, get_current_ip
from .models import (
    ActivityLog, Notification,
    Patient, Machine, Staff, Appointment, TreatmentSession,
    ServiceLog, InventoryItem, Invoice, Attendance,
)


def _notify(title, message, category='system', severity='info', entity_type=None, entity_id=None, link=None):
    """Broadcast notification (recipient=None means visible to every user)."""
    try:
        Notification.objects.create(
            recipient=None,
            title=title,
            message=message,
            category=category,
            severity=severity,
            entity_type=entity_type,
            entity_id=entity_id,
            link=link,
        )
    except Exception:
        pass

# Models tracked by the activity-log
TRACKED_MODELS = [
    (Patient, 'Patient', lambda o: o.full_name or f"Patient #{o.pk}"),
    (Machine, 'Machine', lambda o: f"Unit {o.unit_number}"),
    (Staff, 'Staff', lambda o: o.name or f"Staff #{o.pk}"),
    (Appointment, 'Appointment', lambda o: f"{o.patient.full_name} – {o.date} {o.time_slot}"),
    (TreatmentSession, 'Session', lambda o: f"{o.patient.full_name} – {o.date}"),
    (ServiceLog, 'ServiceLog', lambda o: f"{o.machine.unit_number} – {o.service_type}"),
    (InventoryItem, 'Inventory', lambda o: o.name),
    (Invoice, 'Invoice', lambda o: f"{o.invoice_number} – {o.patient_name}"),
    (Attendance, 'Attendance', lambda o: f"{o.staff.name} – {o.date}"),
]


def _serializable(value):
    try:
        if value is None:
            return None
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        if hasattr(value, 'url'):
            return str(value)
        return value if isinstance(value, (str, int, float, bool, list, dict)) else str(value)
    except Exception:
        return str(value)


def _snapshot(instance):
    """Return a JSON-safe dict of the model's current field values."""
    try:
        raw = model_to_dict(instance)
    except Exception:
        return None
    return {k: _serializable(v) for k, v in raw.items()}


def _diff(old, new):
    """Return only the fields whose value differs between old and new."""
    if not old or not new:
        return None
    changed = {}
    keys = set(old.keys()) | set(new.keys())
    for k in keys:
        if old.get(k) != new.get(k):
            changed[k] = {'from': old.get(k), 'to': new.get(k)}
    return changed or None


def _actor():
    user = get_current_user()
    if not user:
        return None, 'System'
    full = (f"{user.first_name} {user.last_name}").strip() or user.username
    return user, full


def _log(action, entity_type, instance, label_fn, changes=None):
    try:
        label = label_fn(instance)
    except Exception:
        label = f"{entity_type} #{instance.pk}"
    user, actor_name = _actor()
    verb = {'CREATE': 'created', 'UPDATE': 'updated', 'DELETE': 'deleted'}[action]
    ActivityLog.objects.create(
        user=user,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type,
        entity_id=instance.pk,
        entity_label=label,
        description=f"{actor_name} {verb} {entity_type.lower()} \"{label}\"",
        changes=changes,
        ip_address=get_current_ip(),
    )


def _make_handlers(model_cls, entity_type, label_fn):
    @receiver(pre_save, sender=model_cls, weak=False)
    def _pre_save(sender, instance, **kwargs):
        if instance.pk:
            try:
                old = sender.objects.get(pk=instance.pk)
                instance.__activitylog_old = _snapshot(old)
            except sender.DoesNotExist:
                instance.__activitylog_old = None
        else:
            instance.__activitylog_old = None

    @receiver(post_save, sender=model_cls, weak=False)
    def _post_save(sender, instance, created, **kwargs):
        if created:
            _log('CREATE', entity_type, instance, label_fn, changes=_snapshot(instance))
        else:
            old = getattr(instance, '__activitylog_old', None)
            new = _snapshot(instance)
            diff = _diff(old, new)
            if diff:
                _log('UPDATE', entity_type, instance, label_fn, changes=diff)

    @receiver(post_delete, sender=model_cls, weak=False)
    def _post_delete(sender, instance, **kwargs):
        _log('DELETE', entity_type, instance, label_fn, changes=_snapshot(instance))

    # Keep refs alive so receivers aren't garbage collected
    return _pre_save, _post_save, _post_delete


_HANDLERS = [_make_handlers(*entry) for entry in TRACKED_MODELS]


# ============================================================
#  Business-rule notification handlers
# ============================================================

@receiver(post_save, sender=Patient)
def _notify_patient(sender, instance, created, **kwargs):
    if created:
        _notify(
            title='New patient registered',
            message=f"{instance.full_name} has been added to the patient registry.",
            category='patient', severity='info',
            entity_type='Patient', entity_id=instance.pk,
            link=f'/patients/{instance.pk}',
        )


@receiver(post_save, sender=Staff)
def _notify_staff(sender, instance, created, **kwargs):
    if created:
        _notify(
            title='New staff member added',
            message=f"{instance.name} ({instance.role}) has joined the team.",
            category='staff', severity='success',
            entity_type='Staff', entity_id=instance.pk,
            link=f'/staff/{instance.pk}',
        )


@receiver(post_save, sender=InventoryItem)
def _notify_inventory(sender, instance, created, **kwargs):
    # Skip if no threshold set
    if not instance.threshold:
        return

    if instance.stock <= 0:
        _notify(
            title='Out of stock',
            message=f"{instance.name} ({instance.item_code}) is out of stock — re-order required.",
            category='inventory', severity='critical',
            entity_type='Inventory', entity_id=instance.pk,
            link='/inventory',
        )
    elif instance.stock < instance.threshold:
        _notify(
            title='Low stock alert',
            message=f"{instance.name} stock is low ({instance.stock} {instance.unit} left, threshold {instance.threshold}).",
            category='inventory', severity='warning',
            entity_type='Inventory', entity_id=instance.pk,
            link='/inventory',
        )


@receiver(post_save, sender=Invoice)
def _notify_invoice(sender, instance, created, **kwargs):
    if created and instance.status == 'Pending':
        _notify(
            title='New invoice issued',
            message=f"Invoice {instance.invoice_number} for {instance.patient_name} — ₹{instance.amount}.",
            category='billing', severity='info',
            entity_type='Invoice', entity_id=instance.pk,
            link='/billing',
        )
    elif instance.status == 'Overdue':
        _notify(
            title='Invoice overdue',
            message=f"Invoice {instance.invoice_number} for {instance.patient_name} is overdue (₹{instance.amount}).",
            category='billing', severity='critical',
            entity_type='Invoice', entity_id=instance.pk,
            link='/billing',
        )
    elif instance.status == 'Paid' and not created:
        _notify(
            title='Payment received',
            message=f"Invoice {instance.invoice_number} for {instance.patient_name} marked as Paid (₹{instance.amount}).",
            category='billing', severity='success',
            entity_type='Invoice', entity_id=instance.pk,
            link='/billing',
        )


@receiver(post_save, sender=TreatmentSession)
def _notify_session(sender, instance, created, **kwargs):
    critical_outcomes = {'Critical', 'Bleeding', 'BP Dip Observed'}
    if instance.outcome in critical_outcomes:
        _notify(
            title='Critical session outcome',
            message=f"{instance.patient.full_name} — {instance.get_outcome_display()} on {instance.date}.",
            category='session', severity='critical',
            entity_type='Session', entity_id=instance.pk,
            link='/sessions',
        )


@receiver(post_save, sender=Machine)
def _notify_machine(sender, instance, created, **kwargs):
    if not created and instance.status == 'Out of Service':
        _notify(
            title='Machine out of service',
            message=f"Unit {instance.unit_number} ({instance.type}) is marked Out of Service.",
            category='machine', severity='warning',
            entity_type='Machine', entity_id=instance.pk,
            link=f'/machines/{instance.pk}',
        )
    elif not created and instance.status == 'Maintenance':
        _notify(
            title='Machine under maintenance',
            message=f"Unit {instance.unit_number} is now under maintenance.",
            category='machine', severity='info',
            entity_type='Machine', entity_id=instance.pk,
            link=f'/machines/{instance.pk}',
        )


@receiver(post_save, sender=Appointment)
def _notify_appointment(sender, instance, created, **kwargs):
    if created:
        _notify(
            title='New appointment scheduled',
            message=f"{instance.patient.full_name} — {instance.date} {instance.time_slot}.",
            category='appointment', severity='info',
            entity_type='Appointment', entity_id=instance.pk,
            link='/sessions',
        )
