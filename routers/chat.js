// routes/chat.js
const express = require('express');
const router = express.Router();
const { ELARA_PROMPT } = require('../config/prompts');

// Имитация хранилища сессий (в памяти, для демонстрации)
// В production используйте Redis, БД или сессии в файле/БД
const sessions = {};

// Генерация уникального ID для сессии
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --- Эндпоинт для обработки сообщений чата ---
router.post('/chat', async (req, res) => {
    try {
        // 1. Получаем данные из запроса
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Поле 'message' обязательно." });
        }

        // 2. Управление сессией
        let session;
        let isNewSession = false;
        if (sessionId && sessions[sessionId]) {
            session = sessions[sessionId];
        } else {
            // Создаем новую сессию
            const newSessionId = generateSessionId();
            session = {
                id: newSessionId,
                history: [] // Массив объектов {role: 'user'|'elara', content: '...'}
            };
            sessions[newSessionId] = session;
            isNewSession = true;
        }

        // 3. Добавляем сообщение пользователя в историю
        session.history.push({ role: 'user', content: message });

        // 4. Формируем историю для промпта (берем последние N сообщений для экономии контекста)
        const historyForPrompt = session.history.slice(-10); // последние 10 сообщений
        let conversationHistory = "";
        historyForPrompt.forEach(msg => {
            const role = msg.role === 'user' ? 'Игрок' : 'Элара';
            conversationHistory += `${role}: ${msg.content}\n`;
        });

        // 5. Формируем финальный промпт
        const fullPrompt = ELARA_PROMPT.replace('{{conversation_history}}', conversationHistory);

        // 6. Логика взаимодействия с моделью ИИ (пока заглушка)
        console.log("--- Новый запрос ---");
        console.log(`Session ID: ${session.id}`);
        console.log(`Сообщение пользователя: ${message}`);
        console.log(`История (последние 10):`);
        console.log(conversationHistory);
        console.log("-------------------");

        // --- ВРЕМЕННАЯ ЗАГЛУШКА ---
        // Здесь будет вызов OpenRouter API
        // Пока возвращаем случайный ответ или эхо
        let elaraResponse = "";
        if (isNewSession) {
            // Первое сообщение от Элары (приветствие)
            elaraResponse = "Привет... Меня зовут Элара. Я автор книги «Лёд и тишина».\nХочешь, я расскажу тебе о своём путешествии в Антарктиду?";
        } else {
            // Ответ на вопрос игрока (заглушка)
            const responses = [
                "Это интересный вопрос... Позволь мне вспомнить те дни.",
                "Ты знаешь, в полярной ночи время теряет смысл. Возможно, я немного путаю детали...",
                "Память играет с нами странные шутки. Но чувства, описанные в книге, — они настоящие.",
                "Зачем ты спрашиваешь об этом? Тебе не нравится моя история?",
                "Важно не то, что было, а то, что я почувствовала. Разве нет?",
                "Иногда истина сложнее, чем кажется на первый взгляд.",
                "Ты спрашиваешь про даты, а я помню — как дрожали руки, когда я впервые увидела ледник...",
                "Я могла ошибиться в деталях… но не в сути.",
                "Всё, что я описала, происходило со мной. Или... казалось, что происходит.",
                "Почему ты так настаиваешь на фактах? Разве искусство не в правде чувств?"
            ];
            elaraResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        // --- КОНЕЦ ЗАГЛУШКИ ---

        // 7. Добавляем ответ Элары в историю сессии
        session.history.push({ role: 'elara', content: elaraResponse });

        // 8. Отправляем ответ клиенту
        res.json({
            sessionId: session.id,
            response: elaraResponse
        });

    } catch (error) {
        console.error("Ошибка в /api/chat:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера." });
    }
});

module.exports = router;
