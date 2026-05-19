from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, MachineViewSet, StaffViewSet,
    AppointmentViewSet, TreatmentSessionViewSet, ServiceLogViewSet,
    InventoryItemViewSet, InvoiceViewSet, AttendanceViewSet,
    ActivityLogViewSet, NotificationViewSet,
    login_view, register_view, logout_view, me_view
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'machines', MachineViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'treatment-sessions', TreatmentSessionViewSet)
router.register(r'service-logs', ServiceLogViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'activity', ActivityLogViewSet, basename='activity')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('', include(router.urls)),
]
