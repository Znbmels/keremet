from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.utils import timezone
from .models import User, TimeSlot, Appointment, MedicalRecord, Analysis, Doctor
from .serializers import UserSerializer, TimeSlotSerializer, AppointmentSerializer, MedicalRecordSerializer, AnalysisSerializer, DoctorSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DOCTOR'

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PATIENT'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Create user
            user = serializer.save()
            # Set password
            user.set_password(request.data.get('password'))
            user.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        if request.method == 'PUT':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(serializer.data)

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = Doctor.objects.all()
        specialty = self.request.query_params.get('specialty', None)
        if specialty:
            queryset = queryset.filter(specialty=specialty)
        return queryset

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        doctor = get_object_or_404(Doctor, user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        
        # Обновление профиля
        serializer = self.get_serializer(doctor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_photo(self, request, pk=None):
        doctor = self.get_object()
        if 'photo' not in request.FILES:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        doctor.photo = request.FILES['photo']
        doctor.save()
        serializer = self.get_serializer(doctor)
        return Response(serializer.data)

class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'start_time']

    def get_queryset(self):
        if self.request.user.role == 'DOCTOR':
            return TimeSlot.objects.filter(doctor=self.request.user)
        return TimeSlot.objects.filter(status='AVAILABLE')

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return Appointment.objects.filter(doctor=user)
        elif user.role == 'PATIENT':
            return Appointment.objects.filter(patient=user)
        return Appointment.objects.none()

    def perform_create(self, serializer):
        time_slot = serializer.validated_data['time_slot']
        if time_slot.status != 'AVAILABLE':
            return Response({"error": "Time slot is not available"}, status=status.HTTP_400_BAD_REQUEST)
        time_slot.status = 'BOOKED'
        time_slot.save()
        appointment = serializer.save(patient=self.request.user, doctor=time_slot.doctor)
        send_mail(
            'Appointment Confirmation',
            f'You have booked an appointment with {appointment.doctor} at {appointment.time_slot.start_time}',
            'from@example.com',
            [appointment.patient.email],
            fail_silently=True,
        )

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status == 'CANCELED':
            return Response({"error": "Appointment already canceled"}, status=status.HTTP_400_BAD_REQUEST)
        appointment.status = 'CANCELED'
        appointment.time_slot.status = 'AVAILABLE'
        appointment.time_slot.save()
        appointment.save()
        send_mail(
            'Appointment Canceled',
            f'Your appointment with {appointment.doctor} at {appointment.time_slot.start_time} has been canceled',
            'from@example.com',
            [appointment.patient.email],
            fail_silently=True,
        )
        return Response({"status": "Appointment canceled"})

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return MedicalRecord.objects.filter(doctor=user)
        elif user.role == 'PATIENT':
            return MedicalRecord.objects.filter(patient=user)
        return MedicalRecord.objects.none()

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

class AnalysisViewSet(viewsets.ModelViewSet):
    queryset = Analysis.objects.all()
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'date_added']

    def get_queryset(self):
        user = self.request.user
        queryset = Analysis.objects.all()
        
        # Фильтрация по роли пользователя
        if user.role == 'DOCTOR':
            queryset = queryset.filter(doctor=user)
        elif user.role == 'PATIENT':
            queryset = queryset.filter(patient=user)
        
        # Фильтрация по статусу
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Фильтрация по дате
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(date_added__gte=date_from)
        if date_to:
            queryset = queryset.filter(date_added__lte=date_to)
        
        return queryset.order_by('-date_added')

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_result(self, request, pk=None):
        analysis = self.get_object()
        if 'result_file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        analysis.result_file = request.FILES['result_file']
        analysis.status = 'READY'
        analysis.save()
        
        serializer = self.get_serializer(analysis)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        analysis = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status or new_status not in dict(Analysis.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analysis.status = new_status
        analysis.save()
        
        serializer = self.get_serializer(analysis)
        return Response(serializer.data)

class PatientDashboardView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = AppointmentSerializer
    view_type = None
    
    def get_queryset(self):
        if self.view_type == 'upcoming':
            return Appointment.objects.filter(
                patient=self.request.user,
                status='SCHEDULED',
                time_slot__start_time__gte=timezone.now()
            ).order_by('time_slot__start_time')
        elif self.view_type == 'history':
            return Appointment.objects.filter(
                patient=self.request.user,
                time_slot__start_time__lt=timezone.now()
            ).order_by('-time_slot__start_time')
        return Appointment.objects.none()

class DoctorDashboardView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = AppointmentSerializer
    view_type = None
    
    def get_queryset(self):
        if self.view_type == 'upcoming':
            return Appointment.objects.filter(
                doctor=self.request.user,
                status='SCHEDULED',
                time_slot__start_time__gte=timezone.now()
            ).order_by('time_slot__start_time')
        elif self.view_type == 'history':
            return Appointment.objects.filter(
                doctor=self.request.user,
                time_slot__start_time__lt=timezone.now()
            ).order_by('-time_slot__start_time')
        return Appointment.objects.none()

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            User = get_user_model()
            
            try:
                user = User.objects.get(email=email)
                logger.info(f"Login attempt for user: {email}")
            except ObjectDoesNotExist:
                logger.warning(f"Login attempt failed: User with email {email} not found")
                return Response(
                    {"detail": "Пользователь с таким email не найден."},
                    status=status.HTTP_404_NOT_FOUND
                )

            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                logger.info(f"User {email} logged in successfully")
                # Add user role to response
                response.data['user_role'] = user.role
                response.data['user_id'] = user.id
                response.data['full_name'] = f"{user.first_name} {user.last_name}"
            return response

        except TokenError as e:
            logger.error(f"Token error during login: {str(e)}")
            return Response(
                {"detail": "Неверный пароль."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}")
            return Response(
                {"detail": "Произошла ошибка при входе в систему."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )