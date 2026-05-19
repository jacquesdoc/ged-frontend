import { useState, useEffect, useRef } from 'react'
import { chatSearchService } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface Message {
  role:           'user' | 'assistant'
  content:        string
  timestamp:      Date
  mentioned_docs?: any[]
}

interface Conversation {
  id:       string
  title:    string
  messages: Message[]
  date:     Date
}

export default function ChatSearchPage() {
  const [conversations,   setConversations]   = useState<Conversation[]>([])
  const [activeConvId,    setActiveConvId]     = useState<string | null>(null)
  const [messages,        setMessages]         = useState<Message[]>([])
  const [input,           setInput]            = useState('')
  const [loading,         setLoading]          = useState(false)
  const [suggestions,     setSuggestions]      = useState<any[]>([])
  const [showSuggestions, setShowSuggestions]  = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    chatSearchService.suggestions()
      .then(({ data }) => setSuggestions(data.suggestions))
      .catch(console.error)

    const saved = localStorage.getItem('ged_chat_conversations')
    if (saved) {
      const convs = JSON.parse(saved).map((c: any) => ({
        ...c,
        date:     new Date(c.date),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }))
      setConversations(convs)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveConversations = (convs: Conversation[]) => {
    localStorage.setItem('ged_chat_conversations', JSON.stringify(convs))
  }

  const newConversation = () => {
    setActiveConvId(null)
    setMessages([])
    setShowSuggestions(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const loadConversation = (conv: Conversation) => {
    setActiveConvId(conv.id)
    setMessages(conv.messages)
    setShowSuggestions(false)
  }

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    saveConversations(updated)
    if (activeConvId === id) newConversation()
  }

  const handleSend = async (text?: string) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    setShowSuggestions(false)

    const userMsg: Message = {
      role:      'user',
      content:   message,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const { data } = await chatSearchService.chat(message, history)

      const assistantMsg: Message = {
        role:           'assistant',
        content:        data.answer,
        timestamp:      new Date(),
        mentioned_docs: data.mentioned_docs || [],
      }

      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)

      const convTitle = message.length > 45
        ? message.substring(0, 45) + '...'
        : message

      if (activeConvId) {
        const updated = conversations.map(c =>
          c.id === activeConvId ? { ...c, messages: updatedMessages } : c
        )
        setConversations(updated)
        saveConversations(updated)
      } else {
        const newConv: Conversation = {
          id:       Date.now().toString(),
          title:    convTitle,
          messages: updatedMessages,
          date:     new Date(),
        }
        const updated = [newConv, ...conversations]
        setConversations(updated)
        saveConversations(updated)
        setActiveConvId(newConv.id)
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   'Erreur : ' + (err.response?.data?.message || 'Service IA indisponible.'),
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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-900 mt-2 mb-1">{line.slice(2, -2)}</p>
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-green-700 font-bold mt-0.5 flex-shrink-0">-</span>
            <span>{line.slice(2)}</span>
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <p key={i}>{line}</p>
    })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F6F5' }}>

      {/* ── Sidebar ── */}
      <div className="w-60 flex flex-col flex-shrink-0" style={{ background: '#0F2318', borderRight: '1px solid #1A3A28' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #1A3A28' }}>
          <p className="text-xs font-bold text-white tracking-widest uppercase">IVOPREST</p>
          <p className="text-xs mt-0.5" style={{ color: '#4A7A5C' }}>Recherche GED</p>
        </div>

        {/* Bouton nouvelle conversation */}
        <div className="px-4 py-3">
          <button onClick={newConversation}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all text-left"
            style={{ background: '#1A3A28', color: '#7ABA8E', border: '1px solid #2A5A3C' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#234D35')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1A3A28')}
          >
            + Nouvelle conversation
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {conversations.length === 0 ? (
            <p className="text-xs text-center mt-6 px-2" style={{ color: '#3A6A4C' }}>
              Aucune conversation
            </p>
          ) : (
            <div className="space-y-1">
              {/* Grouper par date */}
              {['Aujourd\'hui', 'Precedents'].map((group) => {
                const today = new Date()
                const filtered = conversations.filter(c => {
                  const isToday = c.date.toDateString() === today.toDateString()
                  return group === 'Aujourd\'hui' ? isToday : !isToday
                })
                if (filtered.length === 0) return null
                return (
                  <div key={group}>
                    <p className="text-xs px-2 py-1.5 font-semibold uppercase tracking-wider"
                      style={{ color: '#3A6A4C' }}>
                      {group}
                    </p>
                    {filtered.map((conv) => (
                      <div key={conv.id} onClick={() => loadConversation(conv)}
                        className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5"
                        style={{
                          background: activeConvId === conv.id ? '#1A4A2C' : 'transparent',
                          color: activeConvId === conv.id ? '#A8E4B8' : '#6A9A7C',
                        }}
                        onMouseEnter={e => {
                          if (activeConvId !== conv.id)
                            e.currentTarget.style.background = '#162E1E'
                        }}
                        onMouseLeave={e => {
                          if (activeConvId !== conv.id)
                            e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate font-medium">{conv.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#3A6A4C' }}>
                            {formatDate(conv.date)}
                          </p>
                        </div>
                        <button onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0 hover:text-red-400"
                          style={{ color: '#3A6A4C' }}>
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #1A3A28' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-xs" style={{ color: '#3A6A4C' }}>LLaMA3 connecte</p>
          </div>
        </div>
      </div>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

      {/* Topbar */}
      <div className="bg-white px-6 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid #E2E8E4' }}>
        <div className="flex items-center gap-4">
          {/* Bouton retour */}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            style={{ background: '#F4F7F5', color: '#3A6A4C', border: '1px solid #D0DDD4' }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = '#E8F0EA'
              e.currentTarget.style.borderColor = '#4A9E6A'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = '#F4F7F5'
              e.currentTarget.style.borderColor = '#D0DDD4'
            }}
          >
            Retour
          </button>
          <div>
            <h1 className="text-sm font-bold" style={{ color: '#0F2318' }}>
              Recherche intelligente
            </h1>
            <p className="text-xs" style={{ color: '#6A9A7C' }}>
              {messages.length > 0
                ? `${Math.ceil(messages.length / 2)} echange(s) dans cette conversation`
                : 'Posez vos questions en langage naturel'
              }
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={newConversation}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: '#F0F7F3', color: '#1A6B3C', border: '1px solid #C8E6D4' }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = '#E0F0E8'
              e.currentTarget.style.borderColor = '#4A9E6A'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = '#F0F7F3'
              e.currentTarget.style.borderColor = '#C8E6D4'
            }}
          >
            Nouvelle conversation
          </button>
        )}
      </div>

        {/* Zone messages */}
        <div className="flex-1 overflow-y-auto">

          {/* Page accueil */}
          {messages.length === 0 && showSuggestions && (
            <div className="max-w-2xl mx-auto px-6 py-8">

              {/* Hero */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: '#0F2318' }}>
                  <span className="text-white text-sm font-bold">GED</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Recherche documentaire IA
                </h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Posez vos questions en français naturel. L'IA analyse vos documents,
                  workflows et activites en temps reel.
                </p>
              </div>

              {/* Suggestions */}
              {suggestions.map((cat, i) => (
                <div key={i} className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#2A6A3C' }}>
                    {cat.category}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {cat.items.map((item: string, j: number) => (
                      <button key={j} onClick={() => handleSend(item)}
                        className="text-left px-4 py-3 bg-white rounded-xl text-sm text-gray-700 transition-all font-medium"
                        style={{ border: '1px solid #E2E8E4' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#4A9E6A'
                          e.currentTarget.style.background  = '#F0F7F3'
                          e.currentTarget.style.color       = '#1A5A2C'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E2E8E4'
                          e.currentTarget.style.background  = '#FFFFFF'
                          e.currentTarget.style.color       = '#374151'
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>

                  {/* Avatar IA */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#0F2318' }}>
                      <span className="text-white text-xs font-bold">IA</span>
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 ${
                    msg.role === 'user' ? 'items-end max-w-[75%]' : 'items-start max-w-[85%]'
                  }`}>

                    {/* Bulle */}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'text-gray-800 rounded-tl-sm'
                    }`}
                      style={msg.role === 'user'
                        ? { background: '#1A4A2C' }
                        : { background: '#FFFFFF', border: '1px solid #E8EEE9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
                      }
                    >
                      {msg.role === 'assistant' ? (
                        <div className="space-y-0.5">
                          {formatContent(msg.content)}
                        </div>
                      ) : msg.content}
                    </div>

                    {/* Documents mentionnés */}
                    {msg.role === 'assistant' &&
                     msg.mentioned_docs &&
                     msg.mentioned_docs.length > 0 && (
                      <div className="w-full space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: '#2A6A3C' }}>
                          Documents references
                        </p>
                        {msg.mentioned_docs.map((doc: any, j: number) => (
                          <div key={j} className="bg-white rounded-xl px-4 py-3"
                            style={{ border: '1px solid #D8EEE0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                                doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                doc.status === 'review'   ? 'bg-amber-100 text-amber-700' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {doc.status === 'approved' ? 'Approuve' :
                                 doc.status === 'review'   ? 'En revision' :
                                 doc.status === 'rejected' ? 'Rejete' : 'Brouillon'}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: '#6A9A7C' }}>
                              {doc.folder} · {doc.created_by} · {doc.created_at}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Heure */}
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Avatar user */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#2A4A3C' }}>
                      <span className="text-white text-xs font-bold">Moi</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0F2318' }}>
                    <span className="text-white text-xs font-bold">IA</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ border: '1px solid #E8EEE9' }}>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: '#2A7A4C', animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: '#2A7A4C', animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: '#2A7A4C', animationDelay: '300ms' }} />
                      <span className="text-xs text-gray-400 ml-1">Analyse en cours...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Zone input */}
        <div className="bg-white px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E2E8E4' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 items-end rounded-2xl px-4 py-3 transition-all"
              style={{ background: '#F4F7F5', border: '1px solid #D0DDD4' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur vos documents GED..."
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 disabled:opacity-50 resize-none"
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
              <button onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 font-bold text-sm text-white disabled:opacity-40"
                style={{ background: '#1A4A2C' }}
                onMouseEnter={e => !loading && input.trim() && (e.currentTarget.style.background = '#0F3520')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1A4A2C')}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '→'}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Entree pour envoyer · Maj+Entree pour nouvelle ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}