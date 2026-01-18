import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PLAYERS_LOG_FILE = path.join(__dirname, 'players.json')

function loadPlayers() {
  try {
    if (fs.existsSync(PLAYERS_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(PLAYERS_LOG_FILE, 'utf8'))
    }
  } catch (e) {
    console.error('Error loading players:', e)
  }
  return []
}

function savePlayers(players) {
  fs.writeFileSync(PLAYERS_LOG_FILE, JSON.stringify(players, null, 2))
}

function logPlayerActivity(userId, username, firstName, action, details = {}) {
  const players = loadPlayers()
  const entry = {
    timestamp: new Date().toISOString(),
    userId,
    username,
    firstName,
    action,
    ...details
  }
  players.push(entry)
  savePlayers(players)
  console.log(`[${entry.timestamp}] ${action}: ${firstName} (@${username || userId})`)
}

const app = express()
const PORT = 3002

const BOT_TOKEN = '8522211368:AAHSfKqhQQiE_1mISlscNWO2gmxDQmJkUrs'
const BOT_USERNAME = 'your_bot_username' // TODO: Replace with actual bot username

app.use(cors())
app.use(express.json())

function verifyTelegramAuth(authData) {
  const { hash, ...data } = authData
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest()
  
  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n')
  
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')
  
  return hmac === hash
}

app.post('/api/auth/telegram', (req, res) => {
  const authData = req.body
  
  if (!verifyTelegramAuth(authData)) {
    return res.status(401).json({ error: 'Invalid authentication' })
  }
  
  const authDate = parseInt(authData.auth_date)
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) {
    return res.status(401).json({ error: 'Authentication expired' })
  }
  
  res.json({
    success: true,
    user: {
      id: authData.id,
      first_name: authData.first_name,
      last_name: authData.last_name || '',
      username: authData.username || '',
      photo_url: authData.photo_url || ''
    }
  })
})

app.post('/api/send-message', async (req, res) => {
  const { chatId, message, userName, firstName } = req.body
  
  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId and message are required' })
  }
  
  const isWin = message.includes('Поздравляем') || message.includes('промокод')
  const isLoss = message.includes('проиграл')
  const action = isWin ? 'WIN' : isLoss ? 'LOSS' : 'MESSAGE'
  
  logPlayerActivity(chatId, userName || '', firstName || '', action, { message: message.substring(0, 100) })
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
    
    const data = await response.json()
    
    if (!data.ok) {
      console.error('Telegram API error:', data)
      return res.status(400).json({ error: data.description || 'Failed to send message' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/api/bot-info', async (req, res) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
    const data = await response.json()
    
    if (data.ok) {
      res.json({ username: data.result.username })
    } else {
      res.status(400).json({ error: 'Failed to get bot info' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bot info' })
  }
})

app.get('/api/players', (req, res) => {
  const players = loadPlayers()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const recentPlayers = players.filter(p => new Date(p.timestamp) >= oneWeekAgo)
  
  const summary = {}
  recentPlayers.forEach(p => {
    if (!summary[p.userId]) {
      summary[p.userId] = {
        userId: p.userId,
        username: p.username,
        firstName: p.firstName,
        wins: 0,
        losses: 0,
        lastActivity: p.timestamp
      }
    }
    if (p.action === 'WIN') summary[p.userId].wins++
    if (p.action === 'LOSS') summary[p.userId].losses++
    if (new Date(p.timestamp) > new Date(summary[p.userId].lastActivity)) {
      summary[p.userId].lastActivity = p.timestamp
    }
  })
  
  res.json({
    totalEvents: recentPlayers.length,
    uniquePlayers: Object.keys(summary).length,
    players: Object.values(summary).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
