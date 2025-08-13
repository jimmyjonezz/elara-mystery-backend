// utils/openrouter.js
require('dotenv').config(); // Загружаем переменные окружения

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen3-8b:free"; // Вы можете выбрать другую модель

/**
 * Вызывает OpenRouter API для генерации текста.
 * @param {string} prompt - Промпт для отправки модели.
 * @returns {Promise<string>} - Сгенерированный текст.
 */
async function callOpenRouter(prompt) {
  if (!API_KEY) {
    throw new Error("API ключ OpenRouter не найден. Установите OPENROUTER_API_KEY в .env файле или в переменных окружения Vercel.");
  }

  console.log("-> Отправка запроса в OpenRouter...");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      // Используем заголовки из переменных окружения Vercel или значения по умолчанию
      "HTTP-Referer": process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : "https://elara-mystery-frontend.vercel.app", // Замените на ваш фронтенд
      "X-Title": "Elara Mystery Game",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`<- Ошибка от OpenRouter API: ${response.status} - ${errorText}`);
    throw new Error(`OpenRouter API ошибка: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content?.trim();
  
  if (!aiResponse) {
      throw new Error("Пустой ответ от модели OpenRouter.");
  }

  console.log("<- Ответ от OpenRouter получен.");
  return aiResponse;
}

module.exports = { callOpenRouter };
