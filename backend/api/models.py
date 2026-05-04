from django.db import models

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    patient_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    hiv_status = models.BooleanField(default=False)
    hepatitis_b = models.BooleanField(default=False)
    hepatitis_c = models.BooleanField(default=False)
    diabetes = models.BooleanField(default=False)
    hypertension = models.BooleanField(default=False)
    primary_diagnosis = models.TextField(null=True, blank=True)
    
    dialysis_frequency = models.CharField(max_length=50, null=True, blank=True)
    dry_weight = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Active')
    
    # New Clinical & Info Fields
    age = models.IntegerField(null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, null=True, blank=True)
    current_weight = models.FloatField(null=True, blank=True)
    pulse = models.IntegerField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, null=True, blank=True)
    emergency_phone = models.CharField(max_length=20, null=True, blank=True)
    insurance_provider = models.CharField(max_length=100, null=True, blank=True)
    insurance_id = models.CharField(max_length=50, null=True, blank=True)
    
    # Clinical Safety Fields
    vascular_access = models.CharField(max_length=100, null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)
    clinical_alerts = models.TextField(null=True, blank=True)
    
    notes = models.TextField(null=True, blank=True)
    
    # Registration Form - Identity & Contact
    relation_type = models.CharField(max_length=10, null=True, blank=True)
    relation_name = models.CharField(max_length=100, null=True, blank=True)
    permanent_address = models.TextField(null=True, blank=True)
    contact_person_1_name = models.CharField(max_length=100, null=True, blank=True)
    contact_person_1_phone = models.CharField(max_length=20, null=True, blank=True)
    contact_person_2_name = models.CharField(max_length=100, null=True, blank=True)
    contact_person_2_phone = models.CharField(max_length=20, null=True, blank=True)
    contact_person_3_name = models.CharField(max_length=100, null=True, blank=True)
    contact_person_3_phone = models.CharField(max_length=20, null=True, blank=True)

    # Registration Form - Socio-Economic
    education = models.CharField(max_length=100, null=True, blank=True)
    occupation_past = models.CharField(max_length=100, null=True, blank=True)
    occupation_present = models.CharField(max_length=100, null=True, blank=True)
    income_source = models.CharField(max_length=100, null=True, blank=True) # Salary/Pension/Unemployed
    dialysis_supported_by = models.CharField(max_length=100, null=True, blank=True)
    supporting_person_income = models.CharField(max_length=50, null=True, blank=True)
    marital_status = models.CharField(max_length=50, null=True, blank=True)
    family_constellation = models.TextField(null=True, blank=True)

    # Registration Form - Medical
    ckd_stage_v = models.BooleanField(default=False)
    others_diagnosis = models.TextField(null=True, blank=True)
    av_fistula_created_on = models.DateField(null=True, blank=True)
    dialysis_commenced_on = models.DateField(null=True, blank=True)
    past_medical_history = models.TextField(null=True, blank=True)

    # Scheme Patient Investigations
    usg_abdomen = models.CharField(max_length=255, null=True, blank=True)
    echo = models.CharField(max_length=255, null=True, blank=True)
    urea = models.CharField(max_length=100, null=True, blank=True)
    creatinine = models.CharField(max_length=100, null=True, blank=True)
    haemoglobin = models.CharField(max_length=100, null=True, blank=True)
    electrolytes = models.CharField(max_length=255, null=True, blank=True)

    # Patients Commitments & Registration details
    has_aadhar = models.BooleanField(default=False)
    has_ration = models.BooleanField(default=False)
    has_cmchis = models.BooleanField(default=False)
    registration_date = models.DateField(null=True, blank=True)
    registration_done_by = models.CharField(max_length=100, null=True, blank=True)
    unit_name = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

class Machine(models.Model):
    MACHINE_TYPES = [
        ('Standard', 'Standard'),
        ('HIV', 'HIV-Dedicated'),
    ]
    MACHINE_STATUS = [
        ('In Use', 'In Use'),
        ('Maintenance', 'Maintenance'),
        ('Out of Service', 'Out of Service'),
    ]
    unit_number = models.IntegerField(unique=True)
    type = models.CharField(max_length=20, choices=MACHINE_TYPES, default='Standard')
    status = models.CharField(max_length=20, choices=MACHINE_STATUS, default='In Use')
    last_service_date = models.DateField(null=True, blank=True)
    uptime_percentage = models.FloatField(default=100.0)

    def __str__(self):
        return f"Unit {self.unit_number} ({self.type})"

class Staff(models.Model):
    ROLES = [
        ('Doctor', 'Doctor'),
        ('Nurse', 'Nurse'),
        ('Technician', 'Technician'),
        ('Support', 'Support Staff'),
    ]
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLES)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    is_on_duty = models.BooleanField(default=False)
    avatar_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.role})"

class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    date = models.DateField()
    time_slot = models.CharField(max_length=50) # e.g. "08:00 AM - 12:00 PM"
    status = models.CharField(max_length=20, default='Upcoming')

    def __str__(self):
        return f"{self.patient.full_name} - {self.date} {self.time_slot}"

class TreatmentSession(models.Model):
    OUTCOME_CHOICES = [
        ('Optimal', 'Optimal'),
        ('Stable', 'Stable'),
        ('BP Dip Observed', 'Hypotension (BP Dip)'),
        ('Cramps Observed', 'Muscle Cramps'),
        ('Nausea/Vomiting', 'Nausea / Vomiting'),
        ('Bleeding', 'Excessive Bleeding'),
        ('Critical', 'Critical Complication'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='treatment_history')
    machine = models.CharField(max_length=20) # e.g. "M-002"
    staff = models.CharField(max_length=100) # e.g. "Dr. Sarah Wilson"
    date = models.DateField()
    time = models.CharField(max_length=20) # e.g. "08:30 AM"
    duration = models.CharField(max_length=20) # e.g. "4h 15m"
    
    # Post-Dialysis Data
    post_weight = models.FloatField(null=True, blank=True)
    post_bp = models.CharField(max_length=20, null=True, blank=True)
    fluid_removed = models.FloatField(null=True, blank=True) # in Liters
    heparin_dose = models.CharField(max_length=50, null=True, blank=True)
    medications_given = models.TextField(null=True, blank=True)
    complications = models.TextField(null=True, blank=True)
    
    outcome = models.CharField(max_length=50, choices=OUTCOME_CHOICES, default='Optimal')
    status_color = models.CharField(max_length=20, default='green') # green, yellow, red

    def __str__(self):
        return f"{self.patient.full_name} session on {self.date}"
