# Telegram Login Widget Integration

## Overview

This project uses [Telegram Login Widget](https://core.telegram.org/widgets/login) for user authentication. Users log in via Telegram, and the app can send messages to them through a bot.

## Prerequisites

1. **Telegram Bot** - Create via [@BotFather](https://t.me/BotFather)
2. **Domain with HTTPS** - Required for production (Telegram only allows HTTPS origins)

## Setup Steps

### 1. Create Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot` and follow instructions
3. Save the **Bot Token** (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Send `/setdomain` to set allowed domains for the login widget

### 2. Configure Bot Domain

In BotFather:
```
/setdomain
@your_bot_name
https://yourdomain.com
```

### 3. Server Configuration

Update `server.js` with your bot token:

```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN'
```

## How It Works

### Frontend (App.jsx)

The login widget is loaded dynamically:

```javascript
const script = document.createElement('script')
script.src = 'https://telegram.org/js/telegram-widget.js?22'
script.setAttribute('data-telegram-login', botUsername)
script.setAttribute('data-size', 'large')
script.setAttribute('data-onauth', 'onTelegramAuth(user)')
script.setAttribute('data-request-access', 'write')
```

**Key attributes:**
- `data-telegram-login` - Bot username (without @)
- `data-size` - Widget size: `small`, `medium`, `large`
- `data-onauth` - Callback function name
- `data-request-access` - Request permission to send messages (`write`)

### Callback Handler

```javascript
window.onTelegramAuth = (user) => {
  // user object contains:
  // - id: Telegram user ID
  // - first_name: User's first name
  // - last_name: User's last name (optional)
  // - username: Telegram username (optional)
  // - photo_url: Profile photo URL (optional)
  // - auth_date: Authentication timestamp
  // - hash: Verification hash
  onLogin(user)
}
```

### Backend Verification

The server verifies authentication using HMAC-SHA256:

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

### Sending Messages

After authentication, the app can send messages via Telegram Bot API:

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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bot-info` | GET | Returns bot username |
| `/api/auth/telegram` | POST | Verifies Telegram auth data |
| `/api/send-message` | POST | Sends message to user |

## Security Notes

1. **Never expose BOT_TOKEN** on the frontend
2. **Always verify** auth data on the backend
3. **Check auth_date** - reject old authentications (>24h)
4. **Use HTTPS** in production

## Troubleshooting

### Widget not appearing
- Check if bot domain is configured in BotFather
- Ensure HTTPS is used in production

### Authentication fails
- Verify BOT_TOKEN is correct
- Check if auth_date is not expired

### Messages not sending
- User must have started a conversation with the bot first
- Check if `data-request-access="write"` is set

## References

- [Telegram Login Widget Docs](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
