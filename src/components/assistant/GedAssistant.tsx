import { useState, useEffect, useRef } from 'react'
import { assistantService } from '../../services/api'

interface Message {
  role:      'user' | 'assistant'
  content:   string
  timestamp: Date
}

export default function GedAssistant() {
  const [open,        setOpen]        = useState(false)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role:      'assistant',
        content:   "Bonjour ! Je suis votre assistant GED.\n\nJe connais l'etat de vos documents, workflows et activites en temps reel. Posez-moi n'importe quelle question.",
        timestamp: new Date(),
      }])
      fetchSuggestions()
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSuggestions = async () => {
    try {
      const { data } = await assistantService.suggestions()
      setSuggestions(data.suggestions)
    } catch (err) { console.error(err) }
  }

  const handleSend = async (text?: string) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    setMessages(prev => [...prev, {
      role: 'user', content: message, timestamp: new Date()
    }])
    setLoading(true)

    try {
      const history = messages
        .filter(m => !(m.role === 'assistant' && messages.indexOf(m) === 0))
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await assistantService.chat(message, history)

      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   data.answer,
        timestamp: new Date(),
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   'Erreur : ' + (err.response?.data?.message || 'Service indisponible.'),
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    setTimeout(() => {
      setMessages([{
        role:      'assistant',
        content:   'Conversation reinitialisee. Comment puis-je vous aider ?',
        timestamp: new Date(),
      }])
    }, 100)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ))

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-13 h-13 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 font-bold text-xs"
        style={{
          width:      '52px',
          height:     '52px',
          background: open ? '#1A3A28' : '#0F2318',
          border:     '1px solid #2A5A3C',
          color:      '#7ABA8E',
        }}
        title="Assistant GED"
      >
        {open ? 'X' : 'IA'}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 flex flex-col z-50 overflow-hidden"
          style={{
            width:        '380px',
            height:       '560px',
            background:   '#FFFFFF',
            border:       '1px solid #D0DDD4',
            borderRadius: '16px',
            boxShadow:    '0 8px 32px rgba(15, 35, 24, 0.15)',
          }}
        >

          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background: '#0F2318', borderBottom: '1px solid #1A3A28' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#1A3A28', border: '1px solid #2A5A3C' }}
            >
              <span className="text-xs font-bold" style={{ color: '#7ABA8E' }}>IA</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Assistant GED</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#4ABA6A' }}></div>
                <p className="text-xs" style={{ color: '#4A7A5C' }}>
                  Groq LLaMA3 — En ligne
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-xs px-2 py-1 rounded-lg font-medium transition-colors"
              style={{ color: '#4A7A5C', border: '1px solid #1A3A28' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1A3A28'
                e.currentTarget.style.color      = '#7ABA8E'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color      = '#4A7A5C'
              }}
            >
              Reset
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: '#F8FAF8' }}>

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-[85%] flex flex-col gap-1 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: '#0F2318' }}>
                        <span className="text-white" style={{ fontSize: '8px', fontWeight: 700 }}>
                          IA
                        </span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: '#4A7A5C' }}>
                        Assistant GED
                      </span>
                    </div>
                  )}

                  <div
                    className="px-4 py-2.5 text-sm leading-relaxed"
                    style={msg.role === 'user'
                      ? {
                          background:   '#1A4A2C',
                          color:        '#FFFFFF',
                          borderRadius: '16px 4px 16px 16px',
                        }
                      : {
                          background:   '#FFFFFF',
                          color:        '#1A2A1E',
                          border:       '1px solid #D8EEE0',
                          borderRadius: '4px 16px 16px 16px',
                          boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
                        }
                    }
                  >
                    {formatContent(msg.content)}
                  </div>

                  <span className="text-xs" style={{ color: '#9AB0A0' }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3"
                  style={{
                    background:   '#FFFFFF',
                    border:       '1px solid #D8EEE0',
                    borderRadius: '4px 16px 16px 16px',
                    boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#2A7A4C', animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#2A7A4C', animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#2A7A4C', animationDelay: '300ms' }} />
                    <span className="text-xs ml-1" style={{ color: '#6A9A7C' }}>
                      Analyse en cours...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-4 pb-2 flex-shrink-0"
              style={{ background: '#F8FAF8', borderTop: '1px solid #E8F0EA' }}>
              <p className="text-xs font-bold uppercase tracking-wider py-2"
                style={{ color: '#2A6A3C' }}>
                Suggestions
              </p>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="text-left text-xs px-3 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                    style={{
                      background: '#FFFFFF',
                      color:      '#1A5A2C',
                      border:     '1px solid #C8E6D4',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#F0F7F3'
                      e.currentTarget.style.borderColor = '#4A9E6A'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background  = '#FFFFFF'
                      e.currentTarget.style.borderColor = '#C8E6D4'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 flex-shrink-0"
            style={{ background: '#FFFFFF', borderTop: '1px solid #E8F0EA' }}>
            <div
              className="flex gap-2 items-center px-3 py-2 rounded-xl transition-all"
              style={{ background: '#F4F7F5', border: '1px solid #D0DDD4' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
                style={{ color: '#1A2A1E' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 font-bold text-sm text-white disabled:opacity-40"
                style={{ background: '#1A4A2C' }}
                onMouseEnter={e => !loading && input.trim() && (e.currentTarget.style.background = '#0F3520')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1A4A2C')}
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '→'}
              </button>
            </div>
            <p className="text-xs text-center mt-1.5" style={{ color: '#9AB0A0' }}>
              Entree pour envoyer · Donnees GED en temps reel
            </p>
          </div>
        </div>
      )}
    </>
  )
}