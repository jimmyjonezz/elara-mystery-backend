// api/chat.js
const { ELARA_PROMPT } = require('../config/prompts');
const { callOpenRouter } = require('../utils/openrouter');

// --- Хранилище сессий в памяти (для демонстрации) ---
// ВАЖНО: В production используйте постоянное хранилище (Redis, БД)!
const sessions = {};

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Экспортируемая функция-обработчик для Vercel Function.
 * @param {import('@vercel/node').VercelRequest} req - Объект запроса.
 * @param {import('@vercel/node').VercelResponse} res - Объект ответа.
 */
module.exports = async (req, res) => {
    // --- Настройка CORS для Vercel Function ---
    // Позволяет фронтенду с другого домена (GitHub Pages) делать запросы
    res.setHeader('Access-Control-Allow-Origin', '*'); // В production лучше указать конкретный origin
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка preflight OPTIONS запроса
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Разрешаем только POST-запросы
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
        return;
    }

    try {
        // 1. Получаем данные из запроса (Vercel автоматически парсит JSON)
        const { message, sessionId } = req.body;

        if (!message) {
            res.status(400).json({ error: "Поле 'message' обязательно." });
            return;
        }

        // 2. Управление сессией
        let session;
        let isNewSession = false;
        if (sessionId && sessions[sessionId]) {
            session = sessions[sessionId];
        } else {
            const newSessionId = generateSessionId();
            session = {
                id: newSessionId,
                history: []
            };
            sessions[newSessionId] = session;
            isNewSession = true;
        }

        // 3. Добавляем сообщение пользователя в историю
        session.history.push({ role: 'user', content: message });

        // 4. Формируем историю для промпта
        const historyForPrompt = session.history.slice(-10);
        let conversationHistory = "";
        historyForPrompt.forEach(msg => {
            const role = msg.role === 'user' ? 'Игрок' : 'Элара';
            conversationHistory += `${role}: ${msg.content}\n`;
        });

        // 5. Формируем финальный промпт
        const fullPrompt = ELARA_PROMPT.replace('{{conversation_history}}', conversationHistory);

        // 6. Логика взаимодействия с моделью ИИ
        console.log("--- Новый запрос ---");
        console.log(`Session ID: ${session.id}`);
        console.log(`Сообщение пользователя: ${message}`);
        console.log("-------------------");

        // --- Вызов OpenRouter ---
        let elaraResponse = "";
        try {
            elaraResponse = await callOpenRouter(fullPrompt);
        } catch (apiError) {
            console.error("Ошибка вызова OpenRouter:", apiError.message);
            res.status(500).json({ error: "Не удалось получить ответ от ИИ. Попробуйте позже." });
            return;
        }
        // --- Конец вызова ---

        // 7. Добавляем ответ Элары в историю сессии
        session.history.push({ role: 'elara', content: elaraResponse });

        // 8. Отправляем ответ клиенту
        // Устанавливаем правильный Content-Type
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            sessionId: session.id,
            response: elaraResponse
        });

    } catch (error) {
        console.error("Ошибка в Serverless Function:", error);
        // Устанавливаем Content-Type и отправляем JSON с ошибкой
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: "Внутренняя ошибка сервера." });
    }
};
