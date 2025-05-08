-- Сначала создаем пользователей-врачей
INSERT INTO medical_system_user (password, last_login, email, first_name, last_name, role, specialty, phone, inn, is_active)
VALUES
    -- Терапевты
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'ivanov@keremet.kg', 'Александр', 'Иванов', 'DOCTOR', 'THERAPIST', '+996700123456', '123456789012', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'petrova@keremet.kg', 'Елена', 'Петрова', 'DOCTOR', 'THERAPIST', '+996700123457', '123456789013', true),
    
    -- Хирурги
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'sidorov@keremet.kg', 'Михаил', 'Сидоров', 'DOCTOR', 'SURGEON', '+996700123458', '123456789014', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'kozlova@keremet.kg', 'Анна', 'Козлова', 'DOCTOR', 'SURGEON', '+996700123459', '123456789015', true),
    
    -- Педиатры
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'smirnov@keremet.kg', 'Дмитрий', 'Смирнов', 'DOCTOR', 'PEDIATRICIAN', '+996700123460', '123456789016', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'volkova@keremet.kg', 'Мария', 'Волкова', 'DOCTOR', 'PEDIATRICIAN', '+996700123461', '123456789017', true),
    
    -- Неврологи
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'morozov@keremet.kg', 'Сергей', 'Морозов', 'DOCTOR', 'NEUROLOGIST', '+996700123462', '123456789018', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'sokolova@keremet.kg', 'Ольга', 'Соколова', 'DOCTOR', 'NEUROLOGIST', '+996700123463', '123456789019', true),
    
    -- Кардиологи
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'popov@keremet.kg', 'Андрей', 'Попов', 'DOCTOR', 'CARDIOLOGIST', '+996700123464', '123456789020', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'novikova@keremet.kg', 'Татьяна', 'Новикова', 'DOCTOR', 'CARDIOLOGIST', '+996700123465', '123456789021', true),
    
    -- Стоматологи
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'kuznetsov@keremet.kg', 'Игорь', 'Кузнецов', 'DOCTOR', 'DENTIST', '+996700123466', '123456789022', true),
    (pbkdf2_sha256$600000$your_salt_here$your_hashed_password_here, NULL, 'orlova@keremet.kg', 'Наталья', 'Орлова', 'DOCTOR', 'DENTIST', '+996700123467', '123456789023', true);

-- Теперь создаем записи в таблице Doctor для каждого пользователя
INSERT INTO medical_system_doctor (user_id, specialty, experience, description, education, achievements, consultation_price, available_for_online, photo)
SELECT 
    id,
    specialty,
    FLOOR(RANDOM() * 20 + 5), -- опыт от 5 до 25 лет
    CASE 
        WHEN specialty = 'THERAPIST' THEN 'Опытный терапевт. Специализируется на диагностике и лечении внутренних болезней.'
        WHEN specialty = 'SURGEON' THEN 'Квалифицированный хирург. Проводит широкий спектр хирургических вмешательств.'
        WHEN specialty = 'PEDIATRICIAN' THEN 'Внимательный педиатр. Специализируется на лечении детей всех возрастов.'
        WHEN specialty = 'NEUROLOGIST' THEN 'Опытный невролог. Занимается диагностикой и лечением заболеваний нервной системы.'
        WHEN specialty = 'CARDIOLOGIST' THEN 'Высококвалифицированный кардиолог. Специалист по лечению сердечно-сосудистых заболеваний.'
        ELSE 'Профессиональный стоматолог. Выполняет все виды стоматологических услуг.'
    END,
    'Высшее медицинское образование, ' || 
    CASE 
        WHEN specialty = 'THERAPIST' THEN 'Кыргызская государственная медицинская академия'
        WHEN specialty = 'SURGEON' THEN 'Российский национальный исследовательский медицинский университет'
        WHEN specialty = 'PEDIATRICIAN' THEN 'Казахский национальный медицинский университет'
        WHEN specialty = 'NEUROLOGIST' THEN 'Первый Московский государственный медицинский университет'
        WHEN specialty = 'CARDIOLOGIST' THEN 'Санкт-Петербургский государственный медицинский университет'
        ELSE 'Ташкентский государственный стоматологический институт'
    END,
    'Участник международных конференций, имеет множество сертификатов повышения квалификации',
    FLOOR(RANDOM() * 1000 + 2000)::decimal, -- стоимость консультации от 2000 до 3000 сомов
    true,
    CASE 
        WHEN specialty = 'THERAPIST' THEN 'doctor_photos/therapist.jpg'
        WHEN specialty = 'SURGEON' THEN 'doctor_photos/surgeon.jpg'
        WHEN specialty = 'PEDIATRICIAN' THEN 'doctor_photos/pediatrician.jpg'
        WHEN specialty = 'NEUROLOGIST' THEN 'doctor_photos/neurologist.jpg'
        WHEN specialty = 'CARDIOLOGIST' THEN 'doctor_photos/cardiologist.jpg'
        ELSE 'doctor_photos/dentist.jpg'
    END
FROM medical_system_user
WHERE role = 'DOCTOR'; 