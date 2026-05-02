from rest_framework import serializers
from .models import Patient, Machine, Staff, Appointment, TreatmentSession

class TreatmentSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentSession
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    treatment_history = TreatmentSessionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'

class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.full_name')
    machine_unit = serializers.ReadOnlyField(source='machine.unit_number')
    staff_name = serializers.ReadOnlyField(source='staff.name')

    class Meta:
        model = Appointment
        fields = '__all__'
