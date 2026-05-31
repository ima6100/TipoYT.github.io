const BOT_TOKEN = '8187576862:AAFhxkFRyyInS0IE7Sr_2z3Dtdcr2295a_I';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let chatId = null;
let lastUpdateId = 0;
let pollingInterval = null;

document.getElementById('start-chat').addEventListener('click', startChat);
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('back-btn').addEventListener('click', backToSetup);
document.getElementById('message-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function startChat() {
    chatId = document.getElementById('chat-id').value.trim();
    if (!chatId) {
        alert('Введите Chat ID');
        return;
    }

    document.querySelector('.setup-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
    document.getElementById('status').textContent = 'Чат запущен. Отправьте сообщение!';

    // Начать polling
    startPolling();
}

function backToSetup() {
    stopPolling();
    document.querySelector('.setup-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('status').textContent = 'Готов к работе';
    chatId = null;
    document.getElementById('messages').innerHTML = '';
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const text = messageInput.value.trim();
    if (!text) return;

    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        });

        const data = await response.json();
        if (data.ok) {
            addMessage(text, 'sent', data.result.message_id);
            messageInput.value = '';
            document.getElementById('status').textContent = 'Сообщение отправлено';
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        console.error('Ошибка отправки:', error);
        document.getElementById('status').textContent = 'Ошибка отправки: ' + error.message;
    }
}

function startPolling() {
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                data.result.forEach(update => {
                    if (update.message && update.message.chat.id == chatId && update.message.from.is_bot === false) {
                        // Это сообщение от пользователя, но мы его уже отправили
                    } else if (update.message && update.message.chat.id == chatId && update.message.from.is_bot === true) {
                        // Ответ от бота
                        addMessage(update.message.text, 'received', update.message.message_id);
                    }
                    lastUpdateId = update.update_id;
                });
            }
        } catch (error) {
            console.error('Ошибка polling:', error);
        }
    }, 1000); // Проверять каждую секунду
}

function addMessage(text, type, messageId = null) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    if (messageId) {
        messageDiv.dataset.messageId = messageId;
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteMessage(messageDiv));

    messageDiv.appendChild(textSpan);
    messageDiv.appendChild(deleteBtn);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function deleteMessage(messageDiv) {
    const messageId = messageDiv.dataset.messageId;
    if (messageId) {
        try {
            await fetch(`${API_URL}/deleteMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: parseInt(messageId),
                }),
            });
        } catch (error) {
            console.error('Ошибка удаления в Telegram:', error);
        }
    }
    messageDiv.remove();
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Остановить polling при закрытии страницы
window.addEventListener('beforeunload', stopPolling);