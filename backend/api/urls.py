from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, MachineViewSet, StaffViewSet, 
    AppointmentViewSet, TreatmentSessionViewSet
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'machines', MachineViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'treatment-sessions', TreatmentSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
