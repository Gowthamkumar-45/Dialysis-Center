from django.contrib import admin
from .models import (
    Patient, Machine, ServiceLog, Staff, Attendance,
    Appointment, TreatmentSession, SessionConsumable,
    InventoryItem, Invoice, ActivityLog, Notification,
)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'full_name', 'gender', 'age', 'phone', 'status', 'registration_date')
    list_filter = ('status', 'gender', 'blood_group', 'hiv_status', 'hepatitis_b', 'hepatitis_c', 'diabetes', 'hypertension')
    search_fields = ('patient_id', 'full_name', 'phone', 'email', 'aadhar_number')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'registration_date'
    ordering = ('full_name',)


class ServiceLogInline(admin.TabularInline):
    model = ServiceLog
    extra = 0


@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ('unit_number', 'type', 'status', 'brand', 'model', 'last_service_date', 'uptime_percentage')
    list_filter = ('type', 'status', 'brand', 'has_bpm')
    search_fields = ('unit_number', 'serial_number', 'brand', 'model', 'unit')
    inlines = [ServiceLogInline]
    ordering = ('unit_number',)


@admin.register(ServiceLog)
class ServiceLogAdmin(admin.ModelAdmin):
    list_display = ('machine', 'service_type', 'technician', 'service_date')
    list_filter = ('service_type', 'service_date')
    search_fields = ('machine__unit_number', 'technician', 'service_type')
    date_hierarchy = 'service_date'


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'gender', 'email', 'phone', 'is_on_duty')
    list_filter = ('role', 'gender', 'is_on_duty')
    search_fields = ('name', 'first_name', 'last_name', 'email', 'phone')
    ordering = ('name',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('staff', 'date', 'status', 'check_in', 'check_out', 'work_hours', 'marked_by')
    list_filter = ('status', 'date')
    search_fields = ('staff__name', 'marked_by')
    date_hierarchy = 'date'
    autocomplete_fields = ('staff',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'machine', 'staff', 'date', 'time_slot', 'status')
    list_filter = ('status', 'date', 'machine')
    search_fields = ('patient__full_name', 'patient__patient_id', 'attending_staff')
    date_hierarchy = 'date'
    autocomplete_fields = ('patient', 'machine', 'staff')


class SessionConsumableInline(admin.TabularInline):
    model = SessionConsumable
    extra = 0
    autocomplete_fields = ('item',)


@admin.register(TreatmentSession)
class TreatmentSessionAdmin(admin.ModelAdmin):
    list_display = ('patient', 'machine', 'staff', 'date', 'time', 'duration', 'outcome', 'status_color')
    list_filter = ('outcome', 'status_color', 'date')
    search_fields = ('patient__full_name', 'patient__patient_id', 'machine', 'staff')
    date_hierarchy = 'date'
    inlines = [SessionConsumableInline]
    autocomplete_fields = ('patient',)


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('item_code', 'name', 'category', 'stock', 'threshold', 'unit', 'expiry', 'status')
    list_filter = ('category', 'unit')
    search_fields = ('item_code', 'name')
    ordering = ('name',)

    def status(self, obj):
        return obj.status
    status.short_description = 'Stock Status'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'patient_name', 'amount', 'method', 'status', 'issued_date', 'due_date')
    list_filter = ('status', 'method', 'issued_date')
    search_fields = ('invoice_number', 'patient_name', 'patient_uid')
    date_hierarchy = 'issued_date'
    autocomplete_fields = ('patient',)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor_name', 'action', 'entity_type', 'entity_label', 'ip_address')
    list_filter = ('action', 'entity_type', 'timestamp')
    search_fields = ('actor_name', 'entity_label', 'description', 'ip_address')
    date_hierarchy = 'timestamp'
    readonly_fields = ('user', 'actor_name', 'action', 'entity_type', 'entity_id',
                       'entity_label', 'description', 'changes', 'ip_address', 'timestamp')

    def has_add_permission(self, request):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'category', 'severity', 'is_read', 'created_at')
    list_filter = ('category', 'severity', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'recipient__username')
    date_hierarchy = 'created_at'
    autocomplete_fields = ('recipient',)
