from django.db import models
from django.conf import settings


class Notification(models.Model):
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    CATEGORY_CHOICES = [
        ('patient', 'Patient'),
        ('staff', 'Staff'),
        ('machine', 'Machine'),
        ('session', 'Session'),
        ('appointment', 'Appointment'),
        ('inventory', 'Inventory'),
        ('billing', 'Billing'),
        ('attendance', 'Attendance'),
        ('system', 'System'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='notifications',
    )  # null = broadcast to every user
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    entity_type = models.CharField(max_length=50, null=True, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)
    link = models.CharField(max_length=255, null=True, blank=True)  # frontend route to jump to
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('LOGIN', 'Logged In'),
        ('LOGOUT', 'Logged Out'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='activity_logs',
    )
    actor_name = models.CharField(max_length=150, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField(null=True, blank=True)
    entity_label = models.CharField(max_length=200, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['entity_type', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]

    def __str__(self):
        who = self.actor_name or 'System'
        return f"{who} {self.action} {self.entity_type} #{self.entity_id}"

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
    status_remarks = models.CharField(max_length=255, null=True, blank=True)
    
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
    electrolytes = models.CharField(max_length=50, null=True, blank=True)
    sgot = models.CharField(max_length=50, null=True, blank=True)
    sgpt = models.CharField(max_length=50, null=True, blank=True)

    # Patients Commitments & Registration details
    has_aadhar = models.BooleanField(default=False)
    aadhar_number = models.CharField(max_length=20, null=True, blank=True)
    aadhar_proof = models.FileField(upload_to='proofs/aadhar/', null=True, blank=True)
    
    has_ration = models.BooleanField(default=False)
    ration_number = models.CharField(max_length=20, null=True, blank=True)
    ration_proof = models.FileField(upload_to='proofs/ration/', null=True, blank=True)
    
    has_cmchis = models.BooleanField(default=False)
    cmchis_number = models.CharField(max_length=20, null=True, blank=True)
    cmchis_proof = models.FileField(upload_to='proofs/cmchis/', null=True, blank=True)

    # Patient Photo (captured via camera or uploaded)
    patient_photo = models.ImageField(upload_to='patients/photos/', null=True, blank=True)
    
    registration_date = models.DateField(null=True, blank=True)
    registration_done_by = models.CharField(max_length=100, null=True, blank=True)
    unit_name = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

class Machine(models.Model):
    MACHINE_TYPES = [
        ('Standard', 'Standard Unit'),
        ('HIV', 'HIV-Dedicated Unit'),
        ('HCV', 'HCV-Dedicated Unit'),
        ('HIV_HCV', 'HIV & HCV-Dedicated Unit'),
    ]
    MACHINE_STATUS = [
        ('In Use', 'In Use'),
        ('Maintenance', 'Maintenance'),
        ('Out of Service', 'Out of Service'),
    ]
    unit_number = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20, choices=MACHINE_TYPES, default='Standard')
    status = models.CharField(max_length=20, choices=MACHINE_STATUS, default='In Use')
    last_service_date = models.DateField(null=True, blank=True)
    uptime_percentage = models.FloatField(default=100.0)

    # Extended specs
    unit = models.CharField(max_length=100, null=True, blank=True)  # branch / location label
    brand = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=100, null=True, blank=True)
    has_bpm = models.BooleanField(default=True)
    serial_number = models.CharField(max_length=100, null=True, blank=True)
    installation_date = models.DateField(null=True, blank=True)
    donated_by = models.CharField(max_length=200, null=True, blank=True)
    warranty_years = models.IntegerField(null=True, blank=True)
    amc_from = models.DateField(null=True, blank=True)
    amc_upto = models.DateField(null=True, blank=True)
    running_hours = models.IntegerField(default=0)
    remarks = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Unit {self.unit_number} ({self.type})"

class ServiceLog(models.Model):
    machine = models.ForeignKey(Machine, related_name='service_logs', on_delete=models.CASCADE)
    service_date = models.DateField()
    service_type = models.CharField(max_length=50)
    technician = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.machine.unit_number} - {self.service_type} on {self.service_date}"

class Staff(models.Model):
    ROLES = [
        ('Doctor', 'Doctor'),
        ('Nurse', 'Nurse'),
        ('Technician', 'Technician'),
        ('Support', 'Support Staff'),
    ]
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    first_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    name = models.CharField(max_length=100) # Full name display
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Male')
    role = models.CharField(max_length=20, choices=ROLES)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    is_on_duty = models.BooleanField(default=False)
    staff_photo = models.ImageField(upload_to='staff/photos/', null=True, blank=True)
    avatar_url = models.URLField(null=True, blank=True)
    
    # Professional Summary
    education = models.CharField(max_length=255, null=True, blank=True) # Summary Qualification
    bio = models.TextField(null=True, blank=True)
    
    # 10th Standard
    edu_10th_school = models.CharField(max_length=255, null=True, blank=True)
    edu_10th_mark = models.CharField(max_length=20, null=True, blank=True)
    edu_10th_total = models.CharField(max_length=20, null=True, blank=True)
    edu_10th_year = models.CharField(max_length=20, null=True, blank=True)
    
    # 12th Standard
    edu_12th_school = models.CharField(max_length=255, null=True, blank=True)
    edu_12th_mark = models.CharField(max_length=20, null=True, blank=True)
    edu_12th_total = models.CharField(max_length=20, null=True, blank=True)
    edu_12th_year = models.CharField(max_length=20, null=True, blank=True)
    
    # UG
    edu_ug_college = models.CharField(max_length=255, null=True, blank=True)
    edu_ug_degree = models.CharField(max_length=255, null=True, blank=True)
    edu_ug_mark = models.CharField(max_length=20, null=True, blank=True)
    edu_ug_total = models.CharField(max_length=20, null=True, blank=True)
    edu_ug_year = models.CharField(max_length=20, null=True, blank=True)
    
    # PG
    edu_pg_college = models.CharField(max_length=255, null=True, blank=True)
    edu_pg_degree = models.CharField(max_length=255, null=True, blank=True)
    edu_pg_mark = models.CharField(max_length=20, null=True, blank=True)
    edu_pg_total = models.CharField(max_length=20, null=True, blank=True)
    edu_pg_year = models.CharField(max_length=20, null=True, blank=True)

    # Document Uploads
    id_proof = models.FileField(upload_to='staff/documents/', null=True, blank=True)
    qualification_proof = models.FileField(upload_to='staff/documents/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.role})"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Half-Day', 'Half-Day'),
        ('Leave', 'On Leave'),
    ]
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    work_hours = models.FloatField(default=0.0)
    notes = models.CharField(max_length=255, null=True, blank=True)
    marked_by = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('staff', 'date')
        ordering = ['-date', 'staff__name']

    def calculate_work_hours(self):
        if self.check_in and self.check_out:
            from datetime import datetime, timedelta
            today = datetime.today().date()
            start = datetime.combine(today, self.check_in)
            end = datetime.combine(today, self.check_out)
            if end < start:
                end += timedelta(days=1)
            return round((end - start).total_seconds() / 3600, 2)
        return 0.0

    def save(self, *args, **kwargs):
        self.work_hours = self.calculate_work_hours()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff.name} - {self.date} ({self.status})"


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    attending_staff = models.CharField(max_length=100, null=True, blank=True)
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

class SessionConsumable(models.Model):
    session = models.ForeignKey(TreatmentSession, on_delete=models.CASCADE, related_name='consumables')
    item = models.ForeignKey('InventoryItem', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    def save(self, *args, **kwargs):
        # Automatically reduce stock when a consumable is recorded for a session
        if not self.pk: # Only on creation
            self.item.stock -= self.quantity
            self.item.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.item.name} for {self.session}"


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Dialyzers', 'Dialyzers'),
        ('Tubing', 'Tubing'),
        ('Medication', 'Medication'),
        ('PPE', 'PPE'),
        ('Consumables', 'Consumables'),
        ('Others', 'Others'),
    ]
    UNIT_CHOICES = [
        ('pcs', 'pcs'),
        ('sets', 'sets'),
        ('vials', 'vials'),
        ('boxes', 'boxes'),
        ('bags', 'bags'),
    ]
    item_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Consumables')
    other_category = models.CharField(max_length=100, null=True, blank=True)
    stock = models.IntegerField(default=0)
    threshold = models.IntegerField(default=0)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='pcs')
    expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def status(self):
        if self.stock <= 0:
            return 'Out of Stock'
        if self.stock < self.threshold:
            return 'Low Stock'
        return 'In Stock'

    def __str__(self):
        return f"{self.item_code} - {self.name}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Overdue', 'Overdue'),
    ]
    METHOD_CHOICES = [
        ('Self-Pay', 'Self-Pay'),
        ('CMCHIS', 'CMCHIS'),
        ('Insurance', 'Insurance'),
    ]
    invoice_number = models.CharField(max_length=30, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    patient_name = models.CharField(max_length=100)
    patient_uid = models.CharField(max_length=20, null=True, blank=True)
    issued_date = models.DateField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='Self-Pay')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.invoice_number} - {self.patient_name}"
