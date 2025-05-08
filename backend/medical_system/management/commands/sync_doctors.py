from django.core.management.base import BaseCommand
from medical_system.models import User, Doctor

class Command(BaseCommand):
    help = 'Syncs User model doctors with Doctor model entries'

    def handle(self, *args, **options):
        # Get all users with role='DOCTOR'
        doctor_users = User.objects.filter(role='DOCTOR')
        
        default_values = {
            'experience': 0,
            'description': 'Опытный специалист в своей области',
            'education': 'Высшее медицинское образование',
            'achievements': '',
            'consultation_price': 5000.00,
            'available_for_online': True,
        }
        
        for user in doctor_users:
            # Create or update Doctor model entry
            doctor, created = Doctor.objects.get_or_create(
                user=user,
                defaults={
                    'specialty': user.specialty,
                    **default_values
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created new Doctor entry for {user.get_full_name()} with all fields'))
            else:
                # Update any None values with defaults
                updated = False
                for field, default_value in default_values.items():
                    if getattr(doctor, field) is None:
                        setattr(doctor, field, default_value)
                        updated = True
                
                # Update specialty if it changed
                if doctor.specialty != user.specialty:
                    doctor.specialty = user.specialty
                    updated = True
                
                if updated:
                    doctor.save()
                    self.stdout.write(self.style.SUCCESS(f'Updated Doctor entry for {user.get_full_name()}')) 