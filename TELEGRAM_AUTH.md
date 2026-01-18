# Интеграция Telegram Login Widget

## Обзор

Проект использует [Telegram Login Widget](https://core.telegram.org/widgets/login) для авторизации пользователей. Пользователи входят через Telegram, после чего приложение может отправлять им сообщения через бота.

## Требования

1. **Telegram Bot** — создаётся через [@BotFather](https://t.me/BotFather)
2. **Домен с HTTPS** — обязателен для продакшена (Telegram разрешает только HTTPS)

## Настройка

### 1. Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Сохраните **Bot Token** (например, `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Отправьте `/setdomain` для настройки разрешённых доменов

### 2. Настройка домена бота

В BotFather:
```
/setdomain
@your_bot_name
https://yourdomain.com
```

### 3. Конфигурация сервера

Обновите `server.js`, указав токен бота:

```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN'
```

## Как это работает

### Frontend (App.jsx)

Виджет загружается динамически:

```javascript
const script = document.createElement('script')
script.src = 'https://telegram.org/js/telegram-widget.js?22'
script.setAttribute('data-telegram-login', botUsername)
script.setAttribute('data-size', 'large')
script.setAttribute('data-onauth', 'onTelegramAuth(user)')
script.setAttribute('data-request-access', 'write')
```

**Ключевые атрибуты:**
- `data-telegram-login` — username бота (без @)
- `data-size` — размер виджета: `small`, `medium`, `large`
- `data-onauth` — имя callback-функции
- `data-request-access` — запрос разрешения на отправку сообщений (`write`)

### Обработчик callback

```javascript
window.onTelegramAuth = (user) => {
  // Объект user содержит:
  // - id: Telegram ID пользователя
  // - first_name: Имя пользователя
  // - last_name: Фамилия (опционально)
  // - username: Telegram username (опционально)
  // - photo_url: URL фото профиля (опционально)
  // - auth_date: Timestamp авторизации
  // - hash: Хеш для верификации
  onLogin(user)
}
```

### Верификация на сервере

Сервер проверяет авторизацию с помощью HMAC-SHA256:

```javascript
function verifyTelegramAuth(authData) {
  const { hash, ...data } = authData
  const secretKey = crypto.createHash('sha256')
    .update(BOT_TOKEN)
    .digest()
  
  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n')
  
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')
  
  return hmac === hash
}
```

### Отправка сообщений

После авторизации приложение может отправлять сообщения через Telegram Bot API:

```javascript
await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: userId,
    text: message,
    parse_mode: 'HTML'
  })
})
```

## API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/bot-info` | GET | Возвращает username бота |
| `/api/auth/telegram` | POST | Верифицирует данные авторизации |
| `/api/send-message` | POST | Отправляет сообщение пользователю |

## Безопасность

1. **Никогда не раскрывайте BOT_TOKEN** на фронтенде
2. **Всегда проверяйте** данные авторизации на бэкенде
3. **Проверяйте auth_date** — отклоняйте старые авторизации (>24ч)
4. **Используйте HTTPS** в продакшене

## Решение проблем

### Виджет не появляется
- Проверьте, настроен ли домен в BotFather
- Убедитесь, что используется HTTPS в продакшене

### Авторизация не проходит
- Проверьте правильность BOT_TOKEN
- Проверьте, не истёк ли auth_date

### Сообщения не отправляются
- Пользователь должен сначала начать диалог с ботом
- Проверьте, установлен ли `data-request-access="write"`

## Ссылки

- [Документация Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
