from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver

# Определяем модель User в начале файла
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('PATIENT', 'Patient'),
        ('DOCTOR', 'Doctor'),
        ('ADMIN', 'Admin'),
    )
    
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='PATIENT')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    inn = models.CharField(max_length=12, unique=True, null=True, blank=True)
    average_rating = models.FloatField(default=0.0, editable=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'ADMIN'
        super().save(*args, **kwargs)

# Модель визита
class Visit(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits', limit_choices_to={'role': 'PATIENT'})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_visits', limit_choices_to={'role': 'DOCTOR'})
    time_slot = models.ForeignKey('TimeSlot', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=(('SCHEDULED', 'Scheduled'), ('COMPLETED', 'Completed'), ('CANCELED', 'Canceled')), default='SCHEDULED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visit of {self.patient} with {self.doctor} at {self.created_at}"

# Модель временных слотов
class TimeSlot(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'DOCTOR'})
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=(('AVAILABLE', 'Available'), ('BOOKED', 'Booked'), ('CANCELED', 'Canceled')))

    def __str__(self):
        return f"{self.doctor} - {self.start_time}"

# Модель записи на приём
class Appointment(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'DOCTOR'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_appointments', limit_choices_to={'role': 'PATIENT'})
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=(('SCHEDULED', 'Scheduled'), ('CANCELED', 'Canceled'), ('COMPLETED', 'Completed')))
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.patient} with {self.doctor} at {self.time_slot.start_time}"

# Модель медицинской записи
class MedicalRecord(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_records', limit_choices_to={'role': 'PATIENT'})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_records', limit_choices_to={'role': 'DOCTOR'})
    complaints = models.TextField(blank=True, null=True)
    diagnosis = models.TextField()
    prescription = models.TextField(blank=True, null=True)
    test_result = models.TextField(blank=True, null=True)
    analysis_file = models.FileField(upload_to='medical_records/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Record for {self.patient} by {self.doctor}"

# Модель анализа
class Analysis(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'В обработке'),
        ('READY', 'Готов'),
    )

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_analyses', limit_choices_to={'role': 'PATIENT'})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_analyses', limit_choices_to={'role': 'DOCTOR'})
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    result_file = models.FileField(upload_to='analyses/', null=True, blank=True)
    date_added = models.DateTimeField(default=timezone.now)
    date_completed = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} for {self.patient}"

    def save(self, *args, **kwargs):
        if self.status == 'READY' and not self.date_completed:
            self.date_completed = timezone.now()
        super().save(*args, **kwargs)

# Модель оценки врача
class DoctorRating(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_ratings', limit_choices_to={'role': 'DOCTOR'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_ratings', limit_choices_to={'role': 'PATIENT'})
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='ratings', null=True)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('patient', 'appointment')
        ordering = ['-created_at']

    def __str__(self):
        return f'Rating for {self.doctor} by {self.patient} for appointment {self.appointment_id if self.appointment else "None"} - {self.rating} stars'

@receiver(post_save, sender=DoctorRating)
def update_doctor_rating(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        doctor_to_update = instance.doctor
        
        if not doctor_to_update or not isinstance(doctor_to_update, User):
            print(f"[SIGNAL ERROR] Doctor object is invalid or None for DoctorRating ID: {instance.id}. Doctor ID was: {instance.doctor_id}")
            return

        try:
            User.objects.get(id=doctor_to_update.id) 
        except User.DoesNotExist:
            print(f"[SIGNAL ERROR] User.DoesNotExist for doctor_id: {doctor_to_update.id} (from instance.doctor) in update_doctor_rating signal.")
            return

        avg_rating_data = doctor_to_update.doctor_ratings.all().aggregate(avg_rating=models.Avg('rating'))
        avg_rating = avg_rating_data['avg_rating']

        doctor_to_update.average_rating = round(avg_rating, 1) if avg_rating is not None else 0.0
        doctor_to_update.save(update_fields=['average_rating'])

    except User.DoesNotExist:
        print(f"[SIGNAL CRITICAL] User.DoesNotExist caught unexpectedly in update_doctor_rating for rating ID {instance.id}, doctor_id {instance.doctor_id}.")
    except Exception as e:
        print(f"[SIGNAL ERROR] Unexpected error in update_doctor_rating for rating ID {instance.id}: {str(e)}")

# Перемещаем SPECIALTY_CHOICES перед моделью Doctor
SPECIALTY_CHOICES = [
    ('THERAPIST', 'Терапевт'),
    ('SURGEON', 'Хирург'),
    ('PEDIATRICIAN', 'Педиатр'),
    ('NEUROLOGIST', 'Невролог'),
    ('CARDIOLOGIST', 'Кардиолог'),
    ('DENTIST', 'Стоматолог'),
]

# Модель врача (профиль)
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=100, choices=SPECIALTY_CHOICES)
    experience = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(60)],
        null=True,
        blank=True,
        help_text="Опыт работы в годах"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Дополнительная информация о враче"
    )
    photo = models.ImageField(
        upload_to='doctor_photos/',
        null=True,
        blank=True,
        help_text="Фотография врача"
    )
    education = models.TextField(
        null=True,
        blank=True,
        help_text="Образование и квалификация"
    )
    achievements = models.TextField(
        null=True,
        blank=True,
        help_text="Достижения и награды"
    )
    consultation_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Стоимость консультации"
    )
    available_for_online = models.BooleanField(
        default=False,
        help_text="Доступен для онлайн-консультаций"
    )

    class Meta:
        verbose_name = "Врач"
        verbose_name_plural = "Врачи"

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.specialty}"