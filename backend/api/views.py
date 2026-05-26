import os
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import (
    Patient, Machine, Staff, Appointment, TreatmentSession,
    ServiceLog, InventoryItem, Invoice, Attendance, ActivityLog, Notification
)
from .serializers import (
    PatientSerializer, MachineSerializer, StaffSerializer,
    AppointmentSerializer, TreatmentSessionSerializer, ServiceLogSerializer,
    InventoryItemSerializer, InvoiceSerializer,
    UserSerializer, RegisterSerializer, AttendanceSerializer,
    ActivityLogSerializer, NotificationSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'detail': 'Please provide both username and password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # --- Master Account bootstrap (credentials read from environment) ---
    MASTER_USERNAME = os.environ.get('MASTER_USERNAME')
    MASTER_PASSWORD = os.environ.get('MASTER_PASSWORD')
    MASTER_EMAIL = os.environ.get('MASTER_EMAIL', 'admin@example.com')

    if (MASTER_USERNAME and MASTER_PASSWORD
            and username in [MASTER_USERNAME, MASTER_EMAIL]
            and password == MASTER_PASSWORD):
        user, created = User.objects.get_or_create(
            username=MASTER_USERNAME,
            defaults={
                'email': MASTER_EMAIL,
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created or not user.check_password(MASTER_PASSWORD):
            user.set_password(MASTER_PASSWORD)
            user.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful (Master Account).'
        })
    # ---------------------------------------

    # Allow login with email too
    user = authenticate(username=username, password=password)
    if user is None:
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

    if user is None:
        return Response(
            {'detail': 'Invalid credentials. Please try again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'detail': 'This account has been disabled.'},
            status=status.HTTP_403_FORBIDDEN
        )

    token, _ = Token.objects.get_or_create(user=user)
    _audit(user, 'LOGIN', f"{user.get_full_name() or user.username} signed in.", request)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': 'Login successful.'
    })


def _audit(user, action, description, request=None):
    """Write a login/logout entry to the activity log."""
    from .middleware import CurrentRequestMiddleware
    full_name = (f"{user.first_name} {user.last_name}").strip() or user.username
    ip = CurrentRequestMiddleware._client_ip(request) if request else None
    ActivityLog.objects.create(
        user=user,
        actor_name=full_name,
        action=action,
        entity_type='User',
        entity_id=user.id,
        entity_label=full_name,
        description=description,
        ip_address=ip,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    user = request.user
    try:
        user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        pass
    _audit(user, 'LOGOUT', f"{user.get_full_name() or user.username} signed out.", request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all().order_by('first_name', 'last_name', 'username')
    serializer_class = UserSerializer

class ServiceLogViewSet(viewsets.ModelViewSet):
    queryset = ServiceLog.objects.all()
    serializer_class = ServiceLogSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        Machine.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

class TreatmentSessionViewSet(viewsets.ModelViewSet):
    queryset = TreatmentSession.objects.all()
    serializer_class = TreatmentSessionSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('item_code')
    serializer_class = InventoryItemSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-issued_date')
    serializer_class = InvoiceSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """User-facing notification feed."""
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()

    def get_queryset(self):
        from django.db.models import Q
        qs = super().get_queryset()
        user = self.request.user if self.request.user.is_authenticated else None
        # Return user-specific + broadcast notifications
        if user:
            qs = qs.filter(Q(recipient=user) | Q(recipient__isnull=True))
        else:
            qs = qs.filter(recipient__isnull=True)

        params = self.request.query_params
        if params.get('unread') in ('1', 'true', 'True'):
            qs = qs.filter(is_read=False)
        if params.get('category') and params.get('category') != 'All':
            qs = qs.filter(category=params.get('category'))
        if params.get('severity') and params.get('severity') != 'All':
            qs = qs.filter(severity=params.get('severity'))

        limit = params.get('limit')
        if limit:
            try:
                qs = qs[:int(limit)]
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        from django.db.models import Q
        user = request.user if request.user.is_authenticated else None
        qs = Notification.objects.filter(is_read=False)
        if user:
            qs = qs.filter(Q(recipient=user) | Q(recipient__isnull=True))
        else:
            qs = qs.filter(recipient__isnull=True)
        return Response({'count': qs.count()})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        from django.db.models import Q
        user = request.user if request.user.is_authenticated else None
        qs = Notification.objects.filter(is_read=False)
        if user:
            qs = qs.filter(Q(recipient=user) | Q(recipient__isnull=True))
        else:
            qs = qs.filter(recipient__isnull=True)
        updated = qs.update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        from django.db.models import Q
        user = request.user if request.user.is_authenticated else None
        qs = Notification.objects.all()
        if user:
            qs = qs.filter(Q(recipient=user) | Q(recipient__isnull=True))
        else:
            qs = qs.filter(recipient__isnull=True)
        deleted, _ = qs.delete()
        return Response({'deleted': deleted})


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only feed of every CRUD action performed on tracked entities."""
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        action_param = params.get('action')
        entity = params.get('entity_type')
        user_id = params.get('user')
        search = params.get('search')
        start = params.get('start_date')
        end = params.get('end_date')
        entity_id = params.get('entity_id')
        limit = params.get('limit')

        if action_param and action_param != 'All':
            qs = qs.filter(action=action_param)
        if entity and entity != 'All':
            qs = qs.filter(entity_type=entity)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if start:
            qs = qs.filter(timestamp__date__gte=start)
        if end:
            qs = qs.filter(timestamp__date__lte=end)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(entity_label__icontains=search)
                | Q(description__icontains=search)
                | Q(actor_name__icontains=search)
            )
        if limit:
            try:
                qs = qs[:int(limit)]
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """High-level counters for the activity dashboard."""
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count

        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)

        total = ActivityLog.objects.count()
        today_count = ActivityLog.objects.filter(timestamp__date=today).count()
        week_count = ActivityLog.objects.filter(timestamp__date__gte=week_ago).count()

        by_action = dict(
            ActivityLog.objects.values_list('action').annotate(c=Count('id')).values_list('action', 'c')
        )
        by_entity = list(
            ActivityLog.objects
            .values('entity_type')
            .annotate(c=Count('id'))
            .order_by('-c')[:8]
        )

        return Response({
            'total': total,
            'today': today_count,
            'this_week': week_count,
            'creates': by_action.get('CREATE', 0),
            'updates': by_action.get('UPDATE', 0),
            'deletes': by_action.get('DELETE', 0),
            'by_entity': by_entity,
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('staff').all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        staff_id = self.request.query_params.get('staff')
        status_param = self.request.query_params.get('status')
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')

        if date:
            qs = qs.filter(date=date)
        if start and end:
            qs = qs.filter(date__gte=start, date__lte=end)
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def create(self, request, *args, **kwargs):
        # Upsert behaviour — one record per (staff, date)
        staff_id = request.data.get('staff')
        date = request.data.get('date')
        if staff_id and date:
            existing = Attendance.objects.filter(staff_id=staff_id, date=date).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def daily_roster(self, request):
        """Return every staff member with their attendance status for a given date."""
        from datetime import date as date_cls
        date_str = request.query_params.get('date') or date_cls.today().isoformat()
        records = {a.staff_id: a for a in Attendance.objects.filter(date=date_str).select_related('staff')}

        roster = []
        for member in Staff.objects.all().order_by('name'):
            record = records.get(member.id)
            roster.append({
                'staff_id': member.id,
                'staff_name': member.name,
                'staff_role': member.role,
                'staff_email': member.email,
                'staff_photo': member.staff_photo.url if member.staff_photo else None,
                'staff_avatar_url': member.avatar_url,
                'is_on_duty': member.is_on_duty,
                'attendance_id': record.id if record else None,
                'status': record.status if record else 'Unmarked',
                'check_in': record.check_in.strftime('%H:%M') if record and record.check_in else None,
                'check_out': record.check_out.strftime('%H:%M') if record and record.check_out else None,
                'work_hours': record.work_hours if record else 0.0,
                'notes': record.notes if record else '',
            })

        # Summary
        summary = {
            'date': date_str,
            'total_staff': len(roster),
            'present': sum(1 for r in roster if r['status'] == 'Present'),
            'absent': sum(1 for r in roster if r['status'] == 'Absent'),
            'late': sum(1 for r in roster if r['status'] == 'Late'),
            'half_day': sum(1 for r in roster if r['status'] == 'Half-Day'),
            'leave': sum(1 for r in roster if r['status'] == 'Leave'),
            'unmarked': sum(1 for r in roster if r['status'] == 'Unmarked'),
        }
        return Response({'summary': summary, 'roster': roster})

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Quick check-in for a staff member at current time."""
        from datetime import datetime, date as date_cls
        staff_id = request.data.get('staff')
        if not staff_id:
            return Response({'detail': 'staff is required.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date_cls.today()
        now = datetime.now().time().replace(microsecond=0)
        record, _ = Attendance.objects.get_or_create(staff_id=staff_id, date=today)
        if not record.check_in:
            record.check_in = now
            # Anything after 09:30 is marked Late
            late_threshold = datetime.strptime('09:30', '%H:%M').time()
            record.status = 'Late' if now > late_threshold else 'Present'
            record.save()
        return Response(AttendanceSerializer(record).data)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Quick check-out for a staff member at current time."""
        from datetime import datetime, date as date_cls
        staff_id = request.data.get('staff')
        if not staff_id:
            return Response({'detail': 'staff is required.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date_cls.today()
        now = datetime.now().time().replace(microsecond=0)
        try:
            record = Attendance.objects.get(staff_id=staff_id, date=today)
        except Attendance.DoesNotExist:
            return Response({'detail': 'No check-in recorded for today.'}, status=status.HTTP_400_BAD_REQUEST)
        record.check_out = now
        record.save()
        return Response(AttendanceSerializer(record).data)
