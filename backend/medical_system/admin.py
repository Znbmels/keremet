from django.contrib import admin
from .models import User, TimeSlot, Appointment, MedicalRecord, Analysis, Doctor, DoctorRating, Visit

# Регистрация DoctorRating
@admin.register(DoctorRating)
class DoctorRatingAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'appointment', 'rating', 'comment', 'created_at']
    list_filter = ['doctor', 'patient', 'rating', 'created_at']
    search_fields = ['doctor__email', 'patient__email', 'appointment__id', 'comment']
    readonly_fields = ['created_at']

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialty', 'experience', 'consultation_price', 'available_for_online', 'average_rating']
    search_fields = ['user__first_name', 'user__last_name', 'specialty']
    list_filter = ['specialty', 'available_for_online']
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'specialty', 'experience', 'consultation_price', 'available_for_online')
        }),
        ('Дополнительная информация', {
            'fields': ('description', 'education', 'achievements', 'photo')
        }),
    )

    # Метод для отображения average_rating из модели User
    def average_rating(self, obj):
        return obj.user.average_rating
    average_rating.short_description = 'Средний рейтинг'

# Настройка отображения модели User
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'average_rating']
    list_filter = ['role']
    search_fields = ['email', 'first_name', 'last_name']

# Остальные модели
@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'start_time', 'end_time', 'status']
    list_filter = ['status', 'start_time']
    search_fields = ['doctor__email']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'time_slot', 'status', 'reason']
    list_filter = ['status', 'time_slot__start_time']
    search_fields = ['doctor__email', 'patient__email']

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'created_at', 'diagnosis']
    list_filter = ['created_at']
    search_fields = ['patient__email', 'doctor__email', 'diagnosis']

@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ['name', 'patient', 'doctor', 'status', 'date_added']
    list_filter = ['status', 'date_added']
    search_fields = ['name', 'patient__email', 'doctor__email']

# Регистрация Visit, если нужно
@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'time_slot', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['patient__email', 'doctor__email']