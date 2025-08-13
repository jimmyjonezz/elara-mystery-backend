// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Загружаем переменные окружения из .env

const app = express();
const PORT = process.env.PORT || 3000; // Позволим платформе задать порт, иначе 3000

// --- Middleware ---
// Позволяет серверу понимать JSON в теле запроса
app.use(express.json());
// Разрешаем CORS (важно для запросов с фронтенда на другой домен)
app.use(cors({
  origin: "*" // В production лучше указать конкретный origin, например, ваш GitHub Pages URL
}));

// --- Маршруты ---
// Подключаем маршрут для чата
const chatRoutes = require('./routes/chat');
app.use('/api', chatRoutes); // Все маршруты из chat.js будут начинаться с /api

// --- Запуск сервера ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
