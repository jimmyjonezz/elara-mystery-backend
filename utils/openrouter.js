
// utils/openrouter.js
require('dotenv').config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen3/qwen3-8b:free";

/**
 * Пользовательская ошибка для превышения лимита запросов.
 */
class RateLimitError extends Error {
  constructor(message = "Превышен лимит запросов к модели ИИ. Пожалуйста, попробуйте позже.") {
    super(message);
    this.name = "RateLimitError";
  }
}

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
      "HTTP-Referer": process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : "https://elara-mystery-frontend.vercel.app",
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
    
    // --- НОВОЕ: Специальная обработка 429 ---
    if (response.status === 429) {
      console.error("<- Ошибка 429 от OpenRouter: Лимит запросов превышен.");
      // Можно дополнительно распарсить JSON, если он есть, для получения деталей
      try {
        const errorData = JSON.parse(errorText);
        const errorMsg = errorData?.error?.message || "Слишком много запросов. Пожалуйста, попробуйте позже.";
        throw new RateLimitError(errorMsg);
      } catch (e) {
        // Если не JSON, используем общий текст
        throw new RateLimitError("Слишком много запросов. Пожалуйста, попробуйте позже.");
      }
    }
    // --- КОНЕЦ НОВОГО ---
    
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

module.exports = { callOpenRouter, RateLimitError };
