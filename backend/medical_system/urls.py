from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, DoctorViewSet, TimeSlotViewSet, AppointmentViewSet,
    MedicalRecordViewSet, AnalysisViewSet, PatientDashboardView,
    DoctorDashboardView, CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'time-slots', TimeSlotViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'analyses', AnalysisViewSet)

# URL patterns for the API
urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Patient dashboard URLs
    path('patient/dashboard/appointments/upcoming/', PatientDashboardView.as_view(view_type='upcoming'), name='patient_upcoming_appointments'),
    path('patient/dashboard/appointments/history/', PatientDashboardView.as_view(view_type='history'), name='patient_appointment_history'),
    path('patient/dashboard/analyses/', PatientDashboardView.as_view(), name='patient_analyses'),
    path('patient/dashboard/medical-record/', PatientDashboardView.as_view(), name='patient_medical_record'),
    
    # Doctor dashboard URLs
    path('doctor/dashboard/schedule/', DoctorDashboardView.as_view(), name='doctor_schedule'),
    path('doctor/dashboard/appointments/upcoming/', DoctorDashboardView.as_view(view_type='upcoming'), name='doctor_upcoming_appointments'),
    path('doctor/dashboard/appointments/history/', DoctorDashboardView.as_view(view_type='history'), name='doctor_appointment_history'),
    path('doctor/dashboard/patients/', DoctorDashboardView.as_view(), name='doctor_patients'),
    
    # Doctor time slots and appointments
    path('doctor/', include([
        path('time-slots/', TimeSlotViewSet.as_view({'get': 'list', 'post': 'create'}), name='doctor-time-slots'),
        path('time-slots/<int:pk>/', TimeSlotViewSet.as_view({'delete': 'destroy'}), name='doctor-time-slot-detail'),
        path('appointments/', AppointmentViewSet.as_view({'get': 'list'}), name='doctor-appointments'),
    ])),
]