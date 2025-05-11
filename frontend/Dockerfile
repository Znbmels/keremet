FROM node:16-alpine

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование проекта
COPY . .

# Сборка приложения
RUN npm run build

# Установка serve для раздачи статических файлов
RUN npm install -g serve

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["serve", "-s", "build", "-l", "3000"] 