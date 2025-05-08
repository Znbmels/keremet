from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

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
    
    username = None  # Отключаем поле username
    email = models.EmailField(unique=True)  # Делаем email уникальным
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='PATIENT')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    inn = models.CharField(max_length=12, unique=True, null=True, blank=True)  # Making INN nullable initially

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'ADMIN'
        super().save(*args, **kwargs)

class TimeSlot(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'DOCTOR'})
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=(('AVAILABLE', 'Available'), ('BOOKED', 'Booked'), ('CANCELED', 'Canceled')))

    def __str__(self):
        return f"{self.doctor} - {self.start_time}"

class Appointment(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'DOCTOR'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_appointments', limit_choices_to={'role': 'PATIENT'})
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=(('SCHEDULED', 'Scheduled'), ('CANCELED', 'Canceled'), ('COMPLETED', 'Completed')))
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.patient} with {self.doctor} at {self.time_slot.start_time}"

class MedicalRecord(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_records', limit_choices_to={'role': 'PATIENT'})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_records', limit_choices_to={'role': 'DOCTOR'})
    diagnosis = models.TextField()
    prescription = models.TextField(blank=True, null=True)
    test_result = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Record for {self.patient} by {self.doctor}"

class Analysis(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'В обработке'),
        ('READY', 'Готов'),
        ('CANCELED', 'Отменен'),
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

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=100)
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