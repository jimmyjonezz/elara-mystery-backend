// script.js

// --- НАСТРОЙКА ---
// Укажите здесь URL вашего задеплоенного бэкенда Vercel
const BACKEND_URL = 'https://elara-mystery-xfzqijy4s-jimmyjonezzs-projects.vercel.app/'; // <<<===== ЗАМЕНИТЕ НА ВАШ URL

const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Функция для добавления сообщения в чат
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (role === 'user') {
        messageDiv.classList.add('message--user');
        messageDiv.innerHTML = `
            <div class="message__avatar">Ты</div>
            <div class="message__content"><p>${text}</p></div>
        `;
    } else if (role === 'elara') {
        messageDiv.classList.add('message--elara');
        // Разбиваем текст на абзацы
        const paragraphs = text.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
        messageDiv.innerHTML = `
            <div class="message__avatar">Э</div>
            <div class="message__content">${paragraphs}</div>
        `;
    } else if (role === 'system') {
        messageDiv.classList.add('message--system');
        messageDiv.innerHTML = `
            <div class="message__avatar">Система</div>
            <div class="message__content"><p><em>${text}</em></p></div>
        `;
    }

    chatHistory.appendChild(messageDiv);
    // Прокрутка вниз
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ для получения ответа от бэкенда ---
async function getElaraResponse(userMessage) {
    // Получаем sessionId из localStorage (если есть)
    const storedSessionId = localStorage.getItem('elaraSessionId');

    // Формируем тело запроса
    const requestBody = {
        message: userMessage
    };
    // Если есть сохраненный sessionId, добавляем его в запрос
    if (storedSessionId) {
        requestBody.sessionId = storedSessionId;
    }

    try {
        addMessage('system', 'Элара печатает...'); // Индикатор ожидания

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Убираем индикатор ожидания
        const systemMessages = chatHistory.querySelectorAll('.message--system');
        if (systemMessages.length > 0) {
            chatHistory.removeChild(systemMessages[systemMessages.length - 1]);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Сохраняем sessionId в localStorage для будущих запросов
        if (data.sessionId) {
            localStorage.setItem('elaraSessionId', data.sessionId);
        }

        return data.response;

    } catch (error) {
        console.error("Ошибка при получении ответа от бэкенда:", error);
        // Убираем индикатор ожидания в случае ошибки
        const systemMessages = chatHistory.querySelectorAll('.message--system');
        if (systemMessages.length > 0) {
            chatHistory.removeChild(systemMessages[systemMessages.length - 1]);
        }
        // В случае ошибки API, показываем сообщение пользователю
        throw new Error(`Не удалось связаться с Эларой: ${error.message}`);
    }
}
// --- КОНЕЦ ОБНОВЛЕННОЙ ФУНКЦИИ ---

// Обработчик отправки формы
chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Добавляем сообщение пользователя
    addMessage('user', message);
    // Очищаем поле ввода и блокируем его
    userInput.value = '';
    userInput.disabled = true;
    const submitButton = chatForm.querySelector('button');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    try {
        // Получаем ответ от Элары через бэкенд
        const response = await getElaraResponse(message);
        addMessage('elara', response);
    } catch (error) {
        console.error("Ошибка в обработчике формы:", error);
        addMessage('system', `Ошибка: ${error.message}`);
    } finally {
        // Разблокируем поле ввода
        userInput.disabled = false;
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        userInput.focus();
    }
});

// Фокус на поле ввода при загрузке
window.addEventListener('DOMContentLoaded', (event) => {
    userInput.focus();
});
