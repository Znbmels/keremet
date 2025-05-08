from django.contrib import admin
from .models import User, TimeSlot, Appointment, MedicalRecord, Analysis, Doctor

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialty', 'experience', 'consultation_price', 'available_for_online']
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

admin.site.register(User)
admin.site.register(TimeSlot)
admin.site.register(Appointment)
admin.site.register(MedicalRecord)
admin.site.register(Analysis)