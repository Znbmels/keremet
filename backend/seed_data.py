import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keremet.settings')
django.setup()

from medical_system.models import User, TimeSlot, Appointment, MedicalRecord, Analysis
from django.contrib.auth.hashers import make_password

def create_test_data():
    # Создаем докторов
    doctors = [
        {
            'username': 'dr_smith',
            'password': make_password('doctor123'),
            'email': 'smith@hospital.com',
            'first_name': 'John',
            'last_name': 'Smith',
            'role': 'DOCTOR',
            'specialty': 'Cardiology',
            'phone': '+1234567890',
            'is_staff': True
        },
        {
            'username': 'dr_johnson',
            'password': make_password('doctor123'),
            'email': 'johnson@hospital.com',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'DOCTOR',
            'specialty': 'Neurology',
            'phone': '+1234567891',
            'is_staff': True
        }
    ]

    # Создаем пациентов
    patients = [
        {
            'username': 'patient1',
            'password': make_password('patient123'),
            'email': 'patient1@example.com',
            'first_name': 'Alice',
            'last_name': 'Brown',
            'role': 'PATIENT',
            'phone': '+1234567892'
        },
        {
            'username': 'patient2',
            'password': make_password('patient123'),
            'email': 'patient2@example.com',
            'first_name': 'Bob',
            'last_name': 'Wilson',
            'role': 'PATIENT',
            'phone': '+1234567893'
        }
    ]

    # Создаем пользователей
    created_doctors = []
    for doctor_data in doctors:
        doctor = User.objects.create(**doctor_data)
        created_doctors.append(doctor)
        print(f"Created doctor: {doctor}")

    created_patients = []
    for patient_data in patients:
        patient = User.objects.create(**patient_data)
        created_patients.append(patient)
        print(f"Created patient: {patient}")

    # Создаем временные слоты
    time_slots = []
    for doctor in created_doctors:
        for i in range(5):  # 5 слотов для каждого доктора
            start_time = timezone.now() + timedelta(days=i, hours=9)  # Начинаем с 9 утра
            end_time = start_time + timedelta(hours=1)
            time_slot = TimeSlot.objects.create(
                doctor=doctor,
                start_time=start_time,
                end_time=end_time,
                status='AVAILABLE'
            )
            time_slots.append(time_slot)
            print(f"Created time slot: {time_slot}")

    # Создаем записи на прием
    appointments = []
    for i, patient in enumerate(created_patients):
        for j in range(2):  # 2 записи для каждого пациента
            if i * 2 + j < len(time_slots):
                appointment = Appointment.objects.create(
                    doctor=time_slots[i * 2 + j].doctor,
                    patient=patient,
                    time_slot=time_slots[i * 2 + j],
                    status='SCHEDULED',
                    reason=f'Regular checkup {j+1}'
                )
                time_slots[i * 2 + j].status = 'BOOKED'
                time_slots[i * 2 + j].save()
                appointments.append(appointment)
                print(f"Created appointment: {appointment}")

    # Создаем медицинские записи
    for appointment in appointments:
        medical_record = MedicalRecord.objects.create(
            patient=appointment.patient,
            doctor=appointment.doctor,
            diagnosis='Regular checkup completed',
            prescription='Take vitamins daily',
            test_result='All tests normal',
            created_at=timezone.now()
        )
        print(f"Created medical record: {medical_record}")

    # Создаем анализы
    for patient in created_patients:
        for i in range(2):  # 2 анализа для каждого пациента
            analysis = Analysis.objects.create(
                patient=patient,
                doctor=created_doctors[0],  # Первый доктор назначает все анализы
                name=f'Blood Test {i+1}',
                result_file='analyses/sample.pdf',  # Путь к файлу
                date_added=timezone.now()
            )
            print(f"Created analysis: {analysis}")

if __name__ == '__main__':
    create_test_data() 