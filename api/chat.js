// api/chat.js
const { ELARA_PROMPT } = require('../config/prompts');
const { callOpenRouter, RateLimitError } = require('../utils/openrouter'); // Импортируем RateLimitError

// --- Хранилище сессий в памяти ---
const sessions = {};

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Экспортируемая функция-обработчик для Vercel Function.
 */
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
        return;
    }

    try {
        const { message, sessionId } = req.body;

        if (!message) {
            res.status(400).json({ error: "Поле 'message' обязательно." });
            return;
        }

        let session;
        if (sessionId && sessions[sessionId]) {
            session = sessions[sessionId];
        } else {
            const newSessionId = generateSessionId();
            session = {
                id: newSessionId,
                history: []
            };
            sessions[newSessionId] = session;
        }

        session.history.push({ role: 'user', content: message });

        const historyForPrompt = session.history.slice(-10);
        let conversationHistory = "";
        historyForPrompt.forEach(msg => {
            const role = msg.role === 'user' ? 'Игрок' : 'Элара';
            conversationHistory += `${role}: ${msg.content}\n`;
        });

        const fullPrompt = ELARA_PROMPT.replace('{{conversation_history}}', conversationHistory);

        console.log("--- Новый запрос ---");
        console.log(`Session ID: ${session.id}`);
        console.log(`Сообщение пользователя: ${message}`);
        console.log("-------------------");

        let elaraResponse = "";
        try {
            elaraResponse = await callOpenRouter(fullPrompt);
        } catch (apiError) {
            console.error("Ошибка вызова OpenRouter:", apiError.message);
            
            // --- НОВОЕ: Специальная обработка RateLimitError ---
            if (apiError instanceof RateLimitError) {
                // Отправляем пользователю понятное сообщение
                res.status(429).json({ 
                    error: "Элара устала отвечать на вопросы и нуждается в отдыхе. Пожалуйста, попробуйте позже." 
                });
                return; // ВАЖНО: return, чтобы не выполнить код ниже
            }
            // --- КОНЕЦ НОВОГО ---
            
            // Для всех остальных ошибок API
            res.status(500).json({ error: "Не удалось получить ответ от ИИ. Попробуйте позже." });
            return;
        }

        session.history.push({ role: 'elara', content: elaraResponse });

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            sessionId: session.id,
            response: elaraResponse
        });

    } catch (error) {
        console.error("Ошибка в Serverless Function:", error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: "Внутренняя ошибка сервера." });
    }
};
