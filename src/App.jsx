import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

const API_URL = import.meta.env.PROD ? 'https://shared.metodoxia25.net' : 'http://localhost:3002'

const generatePromoCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const sendToTelegram = async (chatId, message, userName = '', firstName = '') => {
  try {
    await fetch(`${API_URL}/api/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message, userName, firstName })
    })
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error)
  }
}

const checkWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ]
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] }
    }
  }
  return null
}

const minimax = (squares, depth, isMaximizing, alpha, beta) => {
  const result = checkWinner(squares)
  if (result) {
    return result.winner === 'O' ? 10 - depth : depth - 10
  }
  if (squares.every(s => s !== null)) return 0

  if (isMaximizing) {
    let maxEval = -Infinity
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O'
        const evalScore = minimax(squares, depth + 1, false, alpha, beta)
        squares[i] = null
        maxEval = Math.max(maxEval, evalScore)
        alpha = Math.max(alpha, evalScore)
        if (beta <= alpha) break
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'X'
        const evalScore = minimax(squares, depth + 1, true, alpha, beta)
        squares[i] = null
        minEval = Math.min(minEval, evalScore)
        beta = Math.min(beta, evalScore)
        if (beta <= alpha) break
      }
    }
    return minEval
  }
}

const getBestMove = (squares, shouldLose = false) => {
  const availableMoves = squares.map((s, i) => s === null ? i : null).filter(i => i !== null)
  
  if (shouldLose) {
    const movesWithScores = availableMoves.map(i => {
      const newSquares = [...squares]
      newSquares[i] = 'O'
      const score = minimax(newSquares, 0, false, -Infinity, Infinity)
      return { move: i, score }
    })
    
    movesWithScores.sort((a, b) => a.score - b.score)
    
    const worstMoves = movesWithScores.slice(0, Math.max(2, Math.ceil(movesWithScores.length / 2)))
    return worstMoves[Math.floor(Math.random() * worstMoves.length)].move
  }
  
  let bestScore = -Infinity
  let bestMove = null
  const newSquares = [...squares]
  
  for (let i = 0; i < 9; i++) {
    if (!newSquares[i]) {
      newSquares[i] = 'O'
      const score = minimax(newSquares, 0, false, -Infinity, Infinity)
      newSquares[i] = null
      if (score > bestScore) {
        bestScore = score
        bestMove = i
      }
    }
  }
  return bestMove
}

const HeartIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
  </svg>
)

const StarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"/>
  </svg>
)

const FlowerIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C21 10.1 20.1 11 19 11C17.9 11 17 10.1 17 9C17 7.9 17.9 7 19 7C20.1 7 21 7.9 21 9ZM5 9C5 10.1 4.1 11 3 11C1.9 11 1 10.1 1 9C1 7.9 1.9 7 3 7C4.1 7 5 7.9 5 9ZM7.5 4.5C8.6 4.5 9.5 5.4 9.5 6.5C9.5 7.6 8.6 8.5 7.5 8.5C6.4 8.5 5.5 7.6 5.5 6.5C5.5 5.4 6.4 4.5 7.5 4.5ZM16.5 4.5C17.6 4.5 18.5 5.4 18.5 6.5C18.5 7.6 17.6 8.5 16.5 8.5C15.4 8.5 14.5 7.6 14.5 6.5C14.5 5.4 15.4 4.5 16.5 4.5ZM12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8ZM12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18C13.1 18 14 18.9 14 20C14 21.1 13.1 22 12 22ZM5.5 17.5C5.5 18.6 4.6 19.5 3.5 19.5C2.4 19.5 1.5 18.6 1.5 17.5C1.5 16.4 2.4 15.5 3.5 15.5C4.6 15.5 5.5 16.4 5.5 17.5ZM20.5 15.5C21.6 15.5 22.5 16.4 22.5 17.5C22.5 18.6 21.6 19.5 20.5 19.5C19.4 19.5 18.5 18.6 18.5 17.5C18.5 16.4 19.4 15.5 20.5 15.5Z"/>
  </svg>
)

const Cell = ({ value, onClick, isWinning, disabled }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        w-24 h-24 sm:w-28 sm:h-28 rounded-2xl glass-card cell-hover
        flex items-center justify-center text-5xl font-bold
        ${isWinning ? 'ring-4 ring-rose-400 bg-rose-50/80' : ''}
        ${!disabled && !value ? 'cursor-pointer hover:bg-white/80' : 'cursor-default'}
        transition-all duration-300
      `}
      whileHover={!disabled && !value ? { scale: 1.05 } : {}}
      whileTap={!disabled && !value ? { scale: 0.95 } : {}}
    >
      <AnimatePresence mode="wait">
        {value === 'X' && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <HeartIcon className="w-14 h-14 text-rose-500" />
          </motion.div>
        )}
        {value === 'O' && (
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <FlowerIcon className="w-14 h-14 text-lavender-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const WinScreen = ({ promoCode, onPlayAgain }) => {
  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb923c']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb923c']
      })
      
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mb-6"
      >
        <StarIcon className="w-20 h-20 mx-auto text-amber-400" />
      </motion.div>
      
      <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-4">
        Поздравляем!
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Вы выиграли! Ваш промокод на скидку:
      </p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative inline-block mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-lavender-400 to-peach-400 rounded-2xl blur-lg opacity-50" />
        <div className="relative glass-card rounded-2xl px-8 py-6">
          <p className="text-4xl sm:text-5xl font-bold tracking-widest gradient-text font-mono">
            {promoCode}
          </p>
        </div>
      </motion.div>
      
      <p className="text-gray-500 text-sm mb-8">
        Промокод отправлен в Telegram
      </p>
      
      <motion.button
        onClick={onPlayAgain}
        className="btn-primary text-white font-semibold px-8 py-4 rounded-full text-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Сыграть ещё раз
      </motion.button>
    </motion.div>
  )
}

const LoseScreen = ({ onPlayAgain, promoCode }) => {
  useEffect(() => {
    if (promoCode) {
      const duration = 3000
      const end = Date.now() + duration
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb923c']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f43f5e', '#ec4899', '#a855f7', '#fb923c']
        })
        
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [promoCode])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {promoCode ? (
        <>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-6"
          >
            <StarIcon className="w-20 h-20 mx-auto text-amber-400" />
          </motion.div>
          
          <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-4">
            Поздравляем!
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Ваш промокод на скидку:
          </p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-lavender-400 to-peach-400 rounded-2xl blur-lg opacity-50" />
            <div className="relative glass-card rounded-2xl px-8 py-6">
              <p className="text-4xl sm:text-5xl font-bold tracking-widest gradient-text font-mono">
                {promoCode}
              </p>
            </div>
          </motion.div>
          
          <p className="text-gray-500 text-sm mb-8">
            Промокод отправлен в Telegram
          </p>
        </>
      ) : (
        <>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-6"
          >
            <HeartIcon className="w-20 h-20 mx-auto text-gray-300" />
          </motion.div>
          
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-400 mb-4">
            Не повезло...
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Попробуйте ещё раз — удача обязательно улыбнётся!
          </p>
        </>
      )}
      
      <motion.button
        onClick={onPlayAgain}
        className="btn-primary text-white font-semibold px-8 py-4 rounded-full text-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {promoCode ? 'Сыграть ещё раз' : 'Попробовать снова'}
      </motion.button>
    </motion.div>
  )
}

const DrawScreen = ({ onPlayAgain }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        className="mb-6"
      >
        <FlowerIcon className="w-20 h-20 mx-auto text-lavender-400" />
      </motion.div>
      
      <h2 className="font-display text-4xl sm:text-5xl font-bold text-lavender-500 mb-4">
        Ничья!
      </h2>
      <p className="text-gray-500 text-lg mb-8">
        Отличная игра! Попробуйте ещё раз
      </p>
      
      <motion.button
        onClick={onPlayAgain}
        className="btn-primary text-white font-semibold px-8 py-4 rounded-full text-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Сыграть ещё раз
      </motion.button>
    </motion.div>
  )
}

const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const LoginScreen = ({ onLogin, botUsername }) => {
  useEffect(() => {
    if (!botUsername) return
    
    window.onTelegramAuth = (user) => {
      onLogin(user)
    }
    
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '20')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    
    const container = document.getElementById('telegram-login-container')
    if (container) {
      container.innerHTML = ''
      container.appendChild(script)
    }
    
    return () => {
      delete window.onTelegramAuth
    }
  }, [onLogin, botUsername])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-3xl p-8 sm:p-12 max-w-md text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="mb-6"
      >
        <TelegramIcon className="w-20 h-20 mx-auto text-[#2AABEE]" />
      </motion.div>
      
      <h2 className="font-display text-3xl sm:text-4xl font-bold gradient-text mb-4">
        Добро пожаловать!
      </h2>
      <p className="text-gray-500 text-lg mb-8">
        Войдите через Telegram, чтобы начать игру и получить промокод
      </p>
      
      <div id="telegram-login-container" className="flex justify-center mb-6">
        {!botUsername && (
          <div className="text-gray-400 text-sm">Загрузка...</div>
        )}
      </div>
      
      <p className="text-gray-400 text-sm">
        Промокод будет отправлен вам в Telegram
      </p>
    </motion.div>
  )
}

export default function App() {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameState, setGameState] = useState('playing') // playing, won, lost, draw
  const [winningLine, setWinningLine] = useState([])
  const [promoCode, setPromoCode] = useState('')
  const [user, setUser] = useState(null)
  const [botUsername, setBotUsername] = useState('')
  const [gameCount, setGameCount] = useState(() => {
    const saved = localStorage.getItem('gameCount')
    return saved ? parseInt(saved, 10) : 0
  })
  const [isEasyGame, setIsEasyGame] = useState(() => {
    const saved = localStorage.getItem('gameCount')
    const count = saved ? parseInt(saved, 10) : 0
    if (count === 0) return true
    if (count >= 1 && count <= 3) return false
    if (count >= 4 && count <= 5) return true
    return Math.random() < 0.5
  })

  useEffect(() => {
    fetch(`${API_URL}/api/bot-info`)
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setBotUsername(data.username)
        }
      })
      .catch(console.error)
  }, [])

  const handleClick = useCallback((index) => {
    if (squares[index] || !isPlayerTurn || gameState !== 'playing' || !user) return

    const newSquares = [...squares]
    newSquares[index] = 'X'
    setSquares(newSquares)
    
    const result = checkWinner(newSquares)
    if (result) {
      setWinningLine(result.line)
      const code = generatePromoCode()
      setPromoCode(code)
      setGameState('won')
      sendToTelegram(user.id, `🎉 Поздравляем, ${user.first_name}!\n\nВы выиграли в игре «Крестики-Нолики»!\n\n🎁 Ваш промокод на скидку: <b>${code}</b>`, user.username, user.first_name)
      return
    }
    
    if (newSquares.every(s => s !== null)) {
      setGameState('draw')
      return
    }
    
    setIsPlayerTurn(false)
  }, [squares, isPlayerTurn, gameState, user])

  useEffect(() => {
    if (!isPlayerTurn && gameState === 'playing' && user) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(squares, isEasyGame)
        if (bestMove !== null) {
          const newSquares = [...squares]
          newSquares[bestMove] = 'O'
          setSquares(newSquares)
          
          const result = checkWinner(newSquares)
          if (result) {
            setWinningLine(result.line)
            setGameState('lost')
            sendToTelegram(user.id, `😔 ${user.first_name}, к сожалению, вы проиграли.\n\nПопробуйте ещё раз — удача обязательно улыбнётся!`, user.username, user.first_name)
            return
          }
          
          if (newSquares.every(s => s !== null)) {
            setGameState('draw')
            return
          }
          
          setIsPlayerTurn(true)
        }
      }, 600)
      
      return () => clearTimeout(timer)
    }
  }, [isPlayerTurn, squares, gameState, user, isEasyGame])

  const resetGame = () => {
    const newCount = gameCount + 1
    setGameCount(newCount)
    localStorage.setItem('gameCount', newCount.toString())
    
    let shouldBeEasy = false
    if (newCount === 1) {
      shouldBeEasy = true
    } else if (newCount >= 2 && newCount <= 4) {
      shouldBeEasy = false
    } else if (newCount >= 5 && newCount <= 6) {
      shouldBeEasy = true
    } else {
      shouldBeEasy = Math.random() < 0.5
    }
    setIsEasyGame(shouldBeEasy)
    
    setSquares(Array(9).fill(null))
    setIsPlayerTurn(true)
    setGameState('playing')
    setWinningLine([])
    setPromoCode('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden floating-hearts">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
          <HeartIcon className="w-12 h-12 text-rose-400" />
        </motion.div>
      </div>
      <div className="absolute top-40 right-16 opacity-20">
        <motion.div animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }}>
          <StarIcon className="w-10 h-10 text-amber-400" />
        </motion.div>
      </div>
      <div className="absolute bottom-32 left-20 opacity-20">
        <motion.div animate={{ y: [0, -10, 0], rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}>
          <FlowerIcon className="w-14 h-14 text-lavender-400" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 right-10 opacity-20">
        <motion.div animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 2 }}>
          <HeartIcon className="w-8 h-8 text-peach-400" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-2">
          Крестики-Нолики
        </h1>
        <p className="text-gray-500 text-lg">
          Выиграй и получи промокод на скидку!
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!user ? (
          <LoginScreen 
            key="login"
            onLogin={setUser} 
            botUsername={botUsername} 
          />
        ) : gameState === 'playing' ? (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card rounded-3xl p-6 sm:p-8"
          >
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm">
                Привет, <span className="font-semibold text-rose-500">{user.first_name}</span>!
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {squares.map((value, index) => (
                <Cell
                  key={index}
                  value={value}
                  onClick={() => handleClick(index)}
                  isWinning={winningLine.includes(index)}
                  disabled={!isPlayerTurn || gameState !== 'playing'}
                />
              ))}
            </div>
            
            <motion.div
              className="mt-6 text-center"
              animate={{ opacity: isPlayerTurn ? 1 : 0.5 }}
            >
              <p className="text-gray-500 font-medium">
                {isPlayerTurn ? (
                  <span className="flex items-center justify-center gap-2">
                    Ваш ход <HeartIcon className="w-5 h-5 text-rose-500" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Компьютер думает <FlowerIcon className="w-5 h-5 text-lavender-500 animate-spin" />
                  </span>
                )}
              </p>
            </motion.div>
          </motion.div>
        ) : gameState === 'won' ? (
          <motion.div
            key="win"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-3xl p-8 sm:p-12 max-w-md"
          >
            <WinScreen promoCode={promoCode} onPlayAgain={resetGame} />
          </motion.div>
        ) : gameState === 'lost' ? (
          <motion.div
            key="lose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-3xl p-8 sm:p-12 max-w-md"
          >
            <LoseScreen onPlayAgain={resetGame} />
          </motion.div>
        ) : (
          <motion.div
            key="draw"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-3xl p-8 sm:p-12 max-w-md"
          >
            <DrawScreen onPlayAgain={resetGame} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-gray-400 text-sm flex items-center gap-2"
      >
        Вы играете <HeartIcon className="w-4 h-4 text-rose-500" /> против <FlowerIcon className="w-4 h-4 text-lavender-500" />
      </motion.p>
    </div>
  )
}
