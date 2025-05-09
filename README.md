# Медицинская Система

## Описание проекта
Медицинская система для управления приемами, медицинскими записями и анализами пациентов.

## Требования
- Python 3.8+
- Node.js 14+
- PostgreSQL
- pip (менеджер пакетов Python)
- npm (менеджер пакетов Node.js)

## Установка и запуск

### База данных
1. Установите PostgreSQL
2. Создайте новую базу данных:
```sql
CREATE DATABASE medical_system;
```
3. Настройте подключение в файле `backend/medical_system/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'medical_system',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Бэкенд (Django)
1. Перейдите в директорию backend:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # для Linux/Mac
# или
venv\Scripts\activate  # для Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Примените миграции:
```bash
python manage.py migrate
```

5. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

6. Запустите сервер разработки:
```bash
python manage.py runserver
```

### Фронтенд (React)
1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` и добавьте необходимые переменные окружения:
```
REACT_APP_API_URL=http://localhost:8000/api
```

4. Запустите приложение:
```bash
npm start
```

## Доступ к приложению
- Бэкенд API: http://localhost:8000
- Фронтенд: http://localhost:3000
- Админ-панель: http://localhost:8000/admin

## Тестовые данные
Для создания тестовых данных используйте команду:
```bash
python manage.py loaddata initial_data.json
```

## Основные функции
- Регистрация и авторизация пользователей
- Управление приемами
- Создание медицинских записей
- Загрузка и просмотр анализов
- Управление временными слотами для приема
- Профили врачей и пациентов

## Поддержка
При возникновении проблем создайте issue в репозитории проекта или обратитесь к администратору системы. 