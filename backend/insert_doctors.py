import os
import django
from django.contrib.auth.hashers import make_password
import psycopg2
from psycopg2.extras import RealDictCursor

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keremet.settings')
django.setup()

# Параметры подключения к базе данных
DB_PARAMS = {
    'dbname': 'medical_db',
    'user': 'postgres',
    'password': 'admin',
    'host': 'localhost',
    'port': '5432'
}

# Хешируем пароль
hashed_password = make_password('123456')

# SQL запрос для создания пользователей
users_sql = f"""
INSERT INTO medical_system_user (password, last_login, email, first_name, last_name, role, specialty, phone, inn, is_active)
VALUES
    -- Терапевты
    ('{hashed_password}', NULL, 'ivanov@keremet.kg', 'Александр', 'Иванов', 'DOCTOR', 'THERAPIST', '+996700123456', '123456789012', true),
    ('{hashed_password}', NULL, 'petrova@keremet.kg', 'Елена', 'Петрова', 'DOCTOR', 'THERAPIST', '+996700123457', '123456789013', true),
    
    -- Хирурги
    ('{hashed_password}', NULL, 'sidorov@keremet.kg', 'Михаил', 'Сидоров', 'DOCTOR', 'SURGEON', '+996700123458', '123456789014', true),
    ('{hashed_password}', NULL, 'kozlova@keremet.kg', 'Анна', 'Козлова', 'DOCTOR', 'SURGEON', '+996700123459', '123456789015', true),
    
    -- Педиатры
    ('{hashed_password}', NULL, 'smirnov@keremet.kg', 'Дмитрий', 'Смирнов', 'DOCTOR', 'PEDIATRICIAN', '+996700123460', '123456789016', true),
    ('{hashed_password}', NULL, 'volkova@keremet.kg', 'Мария', 'Волкова', 'DOCTOR', 'PEDIATRICIAN', '+996700123461', '123456789017', true),
    
    -- Неврологи
    ('{hashed_password}', NULL, 'morozov@keremet.kg', 'Сергей', 'Морозов', 'DOCTOR', 'NEUROLOGIST', '+996700123462', '123456789018', true),
    ('{hashed_password}', NULL, 'sokolova@keremet.kg', 'Ольга', 'Соколова', 'DOCTOR', 'NEUROLOGIST', '+996700123463', '123456789019', true),
    
    -- Кардиологи
    ('{hashed_password}', NULL, 'popov@keremet.kg', 'Андрей', 'Попов', 'DOCTOR', 'CARDIOLOGIST', '+996700123464', '123456789020', true),
    ('{hashed_password}', NULL, 'novikova@keremet.kg', 'Татьяна', 'Новикова', 'DOCTOR', 'CARDIOLOGIST', '+996700123465', '123456789021', true),
    
    -- Стоматологи
    ('{hashed_password}', NULL, 'kuznetsov@keremet.kg', 'Игорь', 'Кузнецов', 'DOCTOR', 'DENTIST', '+996700123466', '123456789022', true),
    ('{hashed_password}', NULL, 'orlova@keremet.kg', 'Наталья', 'Орлова', 'DOCTOR', 'DENTIST', '+996700123467', '123456789023', true)
RETURNING id, specialty;
"""

# SQL запрос для создания записей докторов
doctors_sql = """
INSERT INTO medical_system_doctor (user_id, specialty, experience, description, education, achievements, consultation_price, available_for_online, photo)
VALUES (%(user_id)s, %(specialty)s, %(experience)s, %(description)s, %(education)s, %(achievements)s, %(consultation_price)s, %(available_for_online)s, %(photo)s);
"""

try:
    # Подключаемся к базе данных
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Создаем пользователей
    cur.execute(users_sql)
    users = cur.fetchall()
    
    # Для каждого созданного пользователя создаем запись доктора
    for user in users:
        doctor_data = {
            'user_id': user['id'],
            'specialty': user['specialty'],
            'experience': 5 + (user['id'] % 20),  # опыт от 5 до 25 лет
            'description': {
                'THERAPIST': 'Опытный терапевт. Специализируется на диагностике и лечении внутренних болезней.',
                'SURGEON': 'Квалифицированный хирург. Проводит широкий спектр хирургических вмешательств.',
                'PEDIATRICIAN': 'Внимательный педиатр. Специализируется на лечении детей всех возрастов.',
                'NEUROLOGIST': 'Опытный невролог. Занимается диагностикой и лечением заболеваний нервной системы.',
                'CARDIOLOGIST': 'Высококвалифицированный кардиолог. Специалист по лечению сердечно-сосудистых заболеваний.',
                'DENTIST': 'Профессиональный стоматолог. Выполняет все виды стоматологических услуг.'
            }[user['specialty']],
            'education': 'Высшее медицинское образование, ' + {
                'THERAPIST': 'Кыргызская государственная медицинская академия',
                'SURGEON': 'Российский национальный исследовательский медицинский университет',
                'PEDIATRICIAN': 'Казахский национальный медицинский университет',
                'NEUROLOGIST': 'Первый Московский государственный медицинский университет',
                'CARDIOLOGIST': 'Санкт-Петербургский государственный медицинский университет',
                'DENTIST': 'Ташкентский государственный стоматологический институт'
            }[user['specialty']],
            'achievements': 'Участник международных конференций, имеет множество сертификатов повышения квалификации',
            'consultation_price': 2000 + (user['id'] % 1000),
            'available_for_online': True,
            'photo': f"doctor_photos/{user['specialty'].lower()}.jpg"
        }
        cur.execute(doctors_sql, doctor_data)
    
    # Подтверждаем транзакцию
    conn.commit()
    print("Врачи успешно добавлены в базу данных!")

except Exception as e:
    print(f"Ошибка: {e}")
    conn.rollback()

finally:
    cur.close()
    conn.close() 