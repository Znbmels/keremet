from rest_framework import serializers
from .models import User, TimeSlot, Appointment, MedicalRecord, Analysis, Doctor

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'password', 'role', 'specialty', 'phone', 'inn']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
            'phone': {'required': True},
            'inn': {'required': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_inn(self, value):
        if not value.isdigit() or len(value) != 12:
            raise serializers.ValidationError("INN must be exactly 12 digits.")
        if User.objects.filter(inn=value).exists():
            raise serializers.ValidationError("A user with this INN already exists.")
        return value

    def validate(self, data):
        if data.get('role') == 'DOCTOR' and not data.get('specialty'):
            raise serializers.ValidationError({"specialty": "Specialty is required for doctors."})
        return data

class TimeSlotSerializer(serializers.ModelSerializer):
    doctor_details = UserSerializer(source='doctor', read_only=True)
    doctor = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='DOCTOR'), write_only=True)

    class Meta:
        model = TimeSlot
        fields = ['id', 'doctor', 'doctor_details', 'start_time', 'end_time', 'status']

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time")
        return data

class AppointmentSerializer(serializers.ModelSerializer):
    doctor = UserSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    time_slot = TimeSlotSerializer(read_only=True)
    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'patient', 'time_slot', 'status', 'reason']

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'doctor', 'diagnosis', 'prescription', 'test_result', 'created_at']

class AnalysisSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = ['id', 'patient', 'doctor', 'name', 'description', 'status', 'status_display', 
                 'result_file', 'result_file_url', 'date_added', 'date_completed']
        read_only_fields = ['patient', 'doctor', 'date_added', 'date_completed']

    def get_result_file_url(self, obj):
        if obj.result_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.result_file.url)
            return obj.result_file.url
        return None

    def validate(self, data):
        if data.get('status') == 'READY' and not data.get('result_file'):
            raise serializers.ValidationError({"result_file": "Result file is required when status is READY"})
        return data

class DoctorSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id', 'first_name', 'last_name', 'email', 'specialty',
            'experience', 'description', 'photo', 'photo_url',
            'education', 'achievements', 'consultation_price',
            'available_for_online'
        ]
        read_only_fields = ['id', 'email']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None