FROM python:3.9-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование файлов зависимостей
COPY requirements.txt .

# Установка зависимостей Python
RUN pip install --no-cache-dir -r requirements.txt

# Копирование проекта
COPY . .

# Создание директории для медиа файлов
RUN mkdir -p /app/media

# Открытие порта
EXPOSE 8000

# Запуск сервера
CMD ["gunicorn", "medical_system.wsgi:application", "--bind", "0.0.0.0:8000"] 