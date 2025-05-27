from rest_framework import serializers
from .models import User, TimeSlot, Appointment, MedicalRecord, Analysis, Doctor, DoctorRating, User, Visit, SPECIALTY_CHOICES


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
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='DOCTOR'),
        write_only=True,
        required=False
    )

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
    time_slot_id = serializers.PrimaryKeyRelatedField(
        queryset=TimeSlot.objects.filter(status='AVAILABLE'),
        source='time_slot',
        write_only=True
    )
    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'patient', 'time_slot', 'time_slot_id', 'status', 'reason']
        read_only_fields = ['doctor', 'patient', 'time_slot']

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    analysis_file_url = serializers.SerializerMethodField()
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'doctor', 'complaints', 'diagnosis', 'prescription', 'test_result', 'analysis_file', 'analysis_file_url', 'created_at']

    def get_analysis_file_url(self, obj):
        if obj.analysis_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.analysis_file.url)
            return obj.analysis_file.url
        return None

class AnalysisSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='PATIENT'))
    doctor = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result_file_url = serializers.SerializerMethodField()
    description = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = Analysis
        fields = ['id', 'patient', 'doctor', 'name', 'description', 'status', 'status_display', 
                 'result_file', 'result_file_url', 'date_added', 'date_completed']
        read_only_fields = ['doctor', 'date_added', 'date_completed']

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
    average_rating = serializers.FloatField(source='user.average_rating', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'specialty',
            'experience', 'description', 'photo', 'photo_url',
            'education', 'achievements', 'consultation_price',
            'available_for_online', 'average_rating'
        ]
        read_only_fields = ['id', 'email', 'average_rating']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    

class DoctorRatingSerializer(serializers.ModelSerializer):
    doctor = UserSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    appointment = serializers.PrimaryKeyRelatedField(queryset=Appointment.objects.all())

    class Meta:
        model = DoctorRating
        fields = ['id', 'doctor', 'patient', 'appointment', 'rating', 'comment', 'created_at']
        read_only_fields = ['doctor', 'patient', 'created_at']

    def validate(self, data):
        request = self.context['request']
        current_patient = request.user
        appointment_instance = data['appointment']

        # Проверка, что пациент из appointment существует
        try:
            appointment_patient = appointment_instance.patient
            if not appointment_patient:
                raise User.DoesNotExist # Для единообразной обработки ниже
        except User.DoesNotExist:
             raise serializers.ValidationError({"appointment": "Пациент, связанный с этим приемом, не найден в системе."})
        
        # Проверка, что доктор из appointment существует
        try:
            appointment_doctor = appointment_instance.doctor
            if not appointment_doctor:
                raise User.DoesNotExist
        except User.DoesNotExist:
            raise serializers.ValidationError({"appointment": "Доктор, связанный с этим приемом, не найден в системе."})

        if appointment_patient != current_patient:
            raise serializers.ValidationError("Вы можете оценивать только свои собственные приемы.")
        if appointment_instance.status != 'COMPLETED':
            raise serializers.ValidationError("Вы можете оценивать только завершенные приемы.")
        if DoctorRating.objects.filter(patient=current_patient, appointment=appointment_instance).exists():
            raise serializers.ValidationError("Этот прием уже был оценен вами.")

        return data

    def create(self, validated_data):
        current_patient = self.context['request'].user
        appointment_instance = validated_data['appointment']
        
        try:
            # Убедимся, что current_patient (из токена) - это существующий User в БД
            # Обычно это так, если аутентификация прошла, но для полноты картины.
            if not isinstance(current_patient, User) or not User.objects.filter(id=current_patient.id).exists():
                raise User.DoesNotExist("Аутентифицированный пользователь (пациент) не найден в базе данных.")
            
            # Убедимся, что доктор из записи на прием существует
            # Эта проверка уже должна быть в validate, но для create добавим еще раз
            final_doctor = appointment_instance.doctor
            if not isinstance(final_doctor, User) or not User.objects.filter(id=final_doctor.id).exists():
                 raise User.DoesNotExist(f"Доктор (ID: {final_doctor.id if final_doctor else 'None'}) указанный в записи на прием, не найден в базе данных.")

            rating = DoctorRating.objects.create(
                doctor=final_doctor,
                patient=current_patient,
                appointment=appointment_instance,
                rating=validated_data['rating'],
                comment=validated_data.get('comment', '')
            )
            return rating
        except User.DoesNotExist as e:
            # Логируем специфическую ошибку, чтобы понять, какой User не найден
            error_message = str(e) if str(e) else "User matching query does not exist в DoctorRatingSerializer.create"
            # Можно добавить логирование в файл или Sentry, если настроено
            print(f"[DEBUG] DoctorRatingSerializer.create User.DoesNotExist: {error_message}") 
            # Поднимаем ValidationError, чтобы фронтенд получил 400 ошибку с сообщением
            raise serializers.ValidationError({"detail": f"Ошибка создания рейтинга: {error_message}"})
        except Exception as e:
            # Ловим другие возможные ошибки при создании
            print(f"[DEBUG] DoctorRatingSerializer.create Exception: {str(e)}")
            raise serializers.ValidationError({"detail": f"Непредвиденная ошибка при создании рейтинга: {str(e)}"})