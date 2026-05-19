from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Patient, Machine, Staff, Appointment, TreatmentSession, ServiceLog, InventoryItem, Invoice, SessionConsumable, Attendance, ActivityLog, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'title', 'message', 'category', 'severity',
            'entity_type', 'entity_id', 'link', 'is_read', 'created_at',
        )
        read_only_fields = ('created_at',)


class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    is_admin = serializers.BooleanField(source='user.is_staff', read_only=True)

    class Meta:
        model = ActivityLog
        fields = (
            'id', 'user', 'user_username', 'user_email', 'is_admin', 'actor_name',
            'action', 'entity_type', 'entity_id', 'entity_label',
            'description', 'changes', 'ip_address', 'timestamp',
        )
        read_only_fields = fields


class AttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    staff_email = serializers.CharField(source='staff.email', read_only=True)
    staff_photo = serializers.ImageField(source='staff.staff_photo', read_only=True)
    staff_avatar_url = serializers.URLField(source='staff.avatar_url', read_only=True)

    class Meta:
        model = Attendance
        fields = (
            'id', 'staff', 'staff_name', 'staff_role', 'staff_email',
            'staff_photo', 'staff_avatar_url',
            'date', 'check_in', 'check_out', 'status',
            'work_hours', 'notes', 'marked_by',
            'created_at', 'updated_at',
        )
        read_only_fields = ('work_hours', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        return user

class SessionConsumableSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionConsumable
        fields = '__all__'

class TreatmentSessionSerializer(serializers.ModelSerializer):
    consumables = SessionConsumableSerializer(many=True, required=False)

    class Meta:
        model = TreatmentSession
        fields = '__all__'

    def create(self, validated_data):
        consumables_data = validated_data.pop('consumables', [])
        session = TreatmentSession.objects.create(**validated_data)
        for consumable_data in consumables_data:
            SessionConsumable.objects.create(session=session, **consumable_data)
        return session

class PatientSerializer(serializers.ModelSerializer):
    treatment_history = TreatmentSessionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'

class ServiceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceLog
        fields = '__all__'

from django.utils import timezone

class MachineSerializer(serializers.ModelSerializer):
    today_sessions = serializers.SerializerMethodField()
    service_history = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()

    class Meta:
        model = Machine
        fields = '__all__'

    def get_total_sessions(self, obj):
        return Appointment.objects.filter(machine=obj).count()

    def get_today_sessions(self, obj):
        today = timezone.now().date()
        appointments = Appointment.objects.filter(machine=obj, date=today).order_by('time_slot')
        return [
            {
                'patient_name': appt.patient.full_name,
                'patient_id': appt.patient.patient_id,
                'time_slot': appt.time_slot,
                'status': appt.status
            }
            for appt in appointments
        ]

    def get_service_history(self, obj):
        logs = obj.service_logs.all().order_by('-service_date')
        return ServiceLogSerializer(logs, many=True).data

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.full_name')
    patient_uid = serializers.ReadOnlyField(source='patient.patient_id')
    machine_unit = serializers.ReadOnlyField(source='machine.unit_number')
    staff_name = serializers.ReadOnlyField(source='staff.name')
    is_hiv = serializers.ReadOnlyField(source='patient.hiv_status')
    is_hcv = serializers.ReadOnlyField(source='patient.hepatitis_c')

    class Meta:
        model = Appointment
        fields = '__all__'

    def validate(self, data):
        patient = data.get('patient')
        date = data.get('date')

        # Check if patient already has an appointment on this day
        # Exclude the current instance if it's an update
        existing = Appointment.objects.filter(patient=patient, date=date)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError({
                "patient": f"Patient '{patient.full_name}' is already scheduled for a session on {date}."
            })

        return data


class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
