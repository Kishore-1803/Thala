import { useState, useEffect, useRef } from 'react'
import { Hash, MoreVertical, Search, Bell, AtSign, Paperclip, Smile, Send, Plus, Clock, Bot, Wrench, Globe, BookOpen, Sparkles, Loader2, CheckCircle, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function SlackSimulator({ messages, currentStep, stepData, onNewMessage, typingUsers = [], onQuickFixRequest, resolvedIncidentIds = new Set(), theme = 'light' }) {
  const messagesEndRef = useRef(null)
  const [displayedMessages, setDisplayedMessages] = useState([])
  const previousMessageCount = useRef(0)
  const [quickFixModal, setQuickFixModal] = useState(null)
  const [loadingIncidentId, setLoadingIncidentId] = useState(null)
  const [mouseCursor, setMouseCursor] = useState({ visible: false, position: { x: 0, y: 0 } })
  const containerRef = useRef(null)
  const [highlightedQuickFixOption, setHighlightedQuickFixOption] = useState(null) // Track which option to highlight next

  const previousMessagesRef = useRef([])
  
  useEffect(() => {
    console.log('[SLACK] Messages prop changed. Length:', messages.length)
    console.log('[SLACK] Message IDs:', messages.map(m => m.id))
    console.log('[SLACK] Messages with Quick Fix:', messages.filter(m => m.quickFix).map(m => ({ id: m.id, quickFix: m.quickFix.title })))
    
    // Always update displayedMessages when messages prop changes
    // This ensures Quick Fix results appear immediately
    if (messages.length > 0) {
      const isNewMessage = messages.length !== previousMessageCount.current
      
      // Check for Quick Fix updates by comparing Quick Fix data
      let hasQuickFixUpdate = false
      if (previousMessagesRef.current.length > 0) {
        hasQuickFixUpdate = messages.some((msg, idx) => {
          const prevMsg = previousMessagesRef.current[idx]
          if (!prevMsg) return false
          // Check if Quick Fix was added or changed
          const currentHasQuickFix = !!msg.quickFix
          const prevHasQuickFix = !!prevMsg.quickFix
          if (currentHasQuickFix !== prevHasQuickFix) return true
          if (currentHasQuickFix && prevHasQuickFix) {
            // Compare Quick Fix titles to detect changes
            return msg.quickFix.title !== prevMsg.quickFix.title
          }
          return false
        })
      }
      
      console.log('[SLACK] Updating displayedMessages. New message:', isNewMessage, 'Quick Fix update:', hasQuickFixUpdate)
      
      // Always update to ensure Quick Fix results appear
      setDisplayedMessages([...messages]) // Create new array reference to ensure React detects change
      previousMessagesRef.current = [...messages]
      
      // Scroll to bottom when new content appears
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
      // Only trigger sound for new messages, not Quick Fix updates
      if (isNewMessage && onNewMessage) {
        onNewMessage()
      }
      
      previousMessageCount.current = messages.length
    }
  }, [messages, onNewMessage])

  const getAvatarColor = (userId) => {
    const colors = ['#E01E5A', '#36C5F0', '#2EB67D', '#ECB22E', '#9B59B6', '#FF6B6B', '#4ECDC4']
    const index = userId.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }
  }

  // Group messages by date
  const groupedMessages = displayedMessages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(msg)
    return groups
  }, {})

  const isThalaBot = (userId) => userId === 'thala' || userId?.startsWith('thala')

  // Helper to remove markdown formatting
  const removeMarkdown = (text) => {
    if (!text) return ''
    return text
      .replace(/^###\s*/gm, '')
      .replace(/^##\s*/gm, '')
      .replace(/^#\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
  }

  // Clear loading state when Quick Fix response appears
  useEffect(() => {
    if (loadingIncidentId) {
      const hasQuickFix = displayedMessages.some(msg => 
        msg.quickFix && msg.quickFix.incidentId === loadingIncidentId
      )
      if (hasQuickFix) {
        setLoadingIncidentId(null)
      }
    }
  }, [displayedMessages, loadingIncidentId])

  const isThankYouMessage = (msg) => msg.id === 'thala-thankyou'
  
  return (
    <div ref={containerRef} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl overflow-hidden h-[800px] flex flex-col border relative`}>
      {/* Mouse Cursor */}
      {mouseCursor.visible && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${mouseCursor.position.x}px`,
            top: `${mouseCursor.position.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill="white"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2" fill="black" />
          </svg>
        </div>
      )}
      {/* Slack Sidebar */}
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 bg-slack-purple text-white flex flex-col border-r border-slack-light">
          {/* Workspace Header */}
          <div className="p-4 border-b border-slack-light">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-slack-purple font-bold text-sm">T</span>
              </div>
              <span className="font-semibold">Thala Workspace</span>
            </div>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="px-2 py-1 text-xs font-semibold text-slack-purple-200 uppercase mb-2">
              Channels
            </div>
            <div className="space-y-1">
              <div className="px-2 py-1.5 bg-slack-light rounded hover:bg-opacity-80 cursor-pointer flex items-center gap-2">
                <Hash size={14} />
                <span className="font-medium">incident-management</span>
              </div>
              <div className="px-2 py-1.5 rounded hover:bg-slack-light cursor-pointer flex items-center gap-2 text-gray-300">
                <Hash size={14} />
                <span>general</span>
              </div>
              <div className="px-2 py-1.5 rounded hover:bg-slack-light cursor-pointer flex items-center gap-2 text-gray-300">
                <Hash size={14} />
                <span>random</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Channel Header */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Hash size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <div>
                  <h2 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>incident-management</h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Company-wide announcements and work-based matters</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Bell size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <button className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Search size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <button className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <MoreVertical size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="ml-1">
                    {typingUsers.map((u, i) => (
                      <span key={i}>
                        {u}
                        {i < typingUsers.length - 1 ? ', ' : ''}
                      </span>
                    ))} typing...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto p-4">
              <AnimatePresence>
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    {/* Date Divider */}
                    <div className="flex items-center my-4">
                      <div className={`flex-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}></div>
                      <span className={`px-3 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{date}</span>
                      <div className={`flex-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}></div>
                    </div>

                    {dateMessages.map((msg, index) => {
                      const prevMsg = index > 0 ? dateMessages[index - 1] : null
                      const showAvatar = !prevMsg || prevMsg.userId !== msg.userId || 
                        (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 300000 // 5 minutes
                      
                      const isBot = isThalaBot(msg.userId)
                      
                      return (
                        <motion.div
                          key={msg.id || `${date}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex gap-3 group rounded-lg p-2 -mx-2 ${!showAvatar ? 'mt-0' : 'mt-4'} ${
                            theme === 'dark' 
                              ? isThankYouMessage(msg) 
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50' 
                                : 'hover:bg-gray-700'
                              : isThankYouMessage(msg)
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200'
                                : 'hover:bg-gray-100'
                          }`}
                        >
                          {/* Avatar */}
                          {showAvatar ? (
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 cursor-pointer overflow-hidden ${
                                isBot ? 'bg-gradient-to-br from-blue-500 to-purple-500' : ''
                              }`}
                              style={!isBot ? { backgroundColor: getAvatarColor(msg.userId) } : {}}
                              title={msg.userName}
                            >
                              {isBot ? (
                                <img 
                                  src="/thala-bot.png" 
                                  alt="Thala Bot" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to Bot icon if image fails to load
                                    const parent = e.target.parentElement
                                    parent.innerHTML = ''
                                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                                    svg.setAttribute('class', 'w-5 h-5')
                                    svg.setAttribute('fill', 'currentColor')
                                    svg.setAttribute('viewBox', '0 0 24 24')
                                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                                    path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z')
                                    svg.appendChild(path)
                                    parent.appendChild(svg)
                                  }}
                                />
                              ) : msg.userName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-10 flex-shrink-0"></div>
                          )}

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            {showAvatar && (
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className={`font-semibold hover:underline cursor-pointer ${
                                  isBot 
                                    ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                    : theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                                }`}>
                                  {msg.userName}
                                </span>
                                {isBot && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    theme === 'dark' 
                                      ? 'bg-blue-900/50 text-blue-300' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>BOT</span>
                                )}
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                            )}

                            {/* Message Text */}
                            <div className={`whitespace-pre-wrap break-words leading-relaxed ${
                              isThankYouMessage(msg)
                                ? theme === 'dark'
                                  ? 'text-white text-lg font-semibold py-2'
                                  : 'text-gray-900 text-lg font-semibold py-2'
                                : theme === 'dark'
                                  ? 'text-gray-200'
                                  : 'text-gray-800'
                            }`}>
                              {msg.text}
                            </div>
                            
                            {/* Special styling for thank you message */}
                            {isThankYouMessage(msg) && (
                              <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                🎉 We hope you enjoyed exploring Thala!
                              </div>
                            )}

                            {/* Bot Structured Responses */}
                            {isBot && msg.incidents && (
                              <div className="mt-3 space-y-3">
                                {msg.incidents.map((incident, idx) => (
                                  <div key={idx} data-incident-id={incident.id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>#{idx + 1}</span>
                                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{incident.text}</span>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        incident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                        incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                        incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {incident.severity}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-4 text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      <span>📍 {incident.source}</span>
                                      <span>🕐 {new Date(incident.timestamp).toLocaleString()}</span>
                                      <span>📁 {incident.category}</span>
                                    </div>
                                    
                                    {/* Resolution Indicator */}
                                    {resolvedIncidentIds.has(incident.id) && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mb-3 p-3 bg-green-50 border-2 border-green-500 rounded-lg flex items-center gap-3"
                                      >
                                        <CheckCircle2 className="text-green-600" size={20} />
                                        <div className="flex-1">
                                          <span className="text-sm font-semibold text-green-800">✅ Incident Resolved</span>
                                          <p className="text-xs text-green-700 mt-1">This incident has been marked as resolved</p>
                                        </div>
                                      </motion.div>
                                    )}
                                    
                                    {/* Loading State */}
                                    {loadingIncidentId === incident.id && (
                                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                                        <Loader2 className="animate-spin text-blue-600" size={20} />
                                        <span className="text-sm text-blue-700">Analyzing incident and gathering solutions...</span>
                                      </div>
                                    )}
                                    
                                    {/* Quick Fix Response in same card */}
                                    {msg.quickFix && msg.quickFix.incidentId === incident.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
                                      >
                                        <div className="flex items-center gap-2 mb-3">
                                          <Wrench className="text-blue-600" size={18} />
                                          <h3 className="font-semibold text-gray-900">{removeMarkdown(msg.quickFix.title)}</h3>
                                        </div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{removeMarkdown(msg.quickFix.content)}</div>
                                        {msg.quickFix.suggestions && (
                                          <div className="mt-3 pt-3 border-t border-blue-200">
                                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Fix Suggestions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                              {msg.quickFix.suggestions.map((suggestion, i) => (
                                                <li key={i}>{removeMarkdown(suggestion)}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        
                                        {/* Show next step hint based on what's been completed */}
                                        {(() => {
                                          // Use displayedMessages (what we're actually rendering) for checks
                                          const hasWebSearch = displayedMessages.some(m => 
                                            m.quickFix && m.quickFix.incidentId === incident.id && m.quickFix.title?.includes('Web Search')
                                          )
                                          const hasPastIncidents = displayedMessages.some(m => 
                                            m.quickFix && m.quickFix.incidentId === incident.id && m.quickFix.title?.includes('Past Incidents')
                                          )
                                          
                                          if (hasWebSearch && !hasPastIncidents) {
                                            return (
                                              <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-300">
                                                <ArrowRight className="animate-pulse text-yellow-600" size={18} />
                                                <span className="font-medium">Next: Click "Quick Fix" button below to try Past Incidents</span>
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                      </motion.div>
                                    )}
                                    
                                    {/* Show Quick Fix button - hide only if all options are completed */}
                                    {(() => {
                                      // Use displayedMessages (what we're actually rendering) for checks
                                      const hasWebSearch = displayedMessages.some(m => 
                                        m.quickFix && m.quickFix.incidentId === incident.id && m.quickFix.title?.includes('Web Search')
                                      )
                                      const hasPastIncidents = displayedMessages.some(m => 
                                        m.quickFix && m.quickFix.incidentId === incident.id && m.quickFix.title?.includes('Past Incidents')
                                      )
                                      const allCompleted = hasWebSearch && hasPastIncidents
                                      
                                      if (allCompleted) {
                                        return (
                                          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                                            <CheckCircle2 className="text-green-600" size={16} />
                                            <span className="font-medium">All Quick Fix options completed</span>
                                          </div>
                                        )
                                      }
                                      
                                      // Determine which option is next
                                      const nextOption = !hasWebSearch ? 'Web Search' : 
                                                       !hasPastIncidents ? 'Past Incidents' : null
                                      
                                      return (
                                        <button
                                          key={`quickfix-${incident.id}`}
                                          ref={(el) => {
                                            if (el && incident.id) {
                                              // Store button ref for mouse animation
                                            }
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            const button = e.currentTarget
                                            if (button && containerRef.current) {
                                              const buttonRect = button.getBoundingClientRect()
                                              const containerRect = containerRef.current.getBoundingClientRect()
                                              
                                              // Animate mouse cursor to button
                                              setMouseCursor({
                                                visible: true,
                                                position: {
                                                  x: buttonRect.left + buttonRect.width / 2 - containerRect.left,
                                                  y: buttonRect.top + buttonRect.height / 2 - containerRect.top
                                                }
                                              })
                                              
                                              setTimeout(() => {
                                                setQuickFixModal({ incidentId: incident.id, incident: incident })
                                                setMouseCursor({ visible: false, position: { x: 0, y: 0 } })
                                              }, 500)
                                            } else {
                                              setQuickFixModal({ incidentId: incident.id, incident: incident })
                                            }
                                          }}
                                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                                            nextOption 
                                              ? 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-yellow-400 shadow-lg animate-pulse'
                                              : 'bg-blue-600 text-white hover:bg-blue-700'
                                          }`}
                                          type="button"
                                        >
                                          <Wrench size={14} />
                                          Quick Fix
                                        </button>
                                      )
                                    })()}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Standalone Quick Fix Response (for non-incident responses) */}
                            {isBot && msg.quickFix && !msg.incidents && (
                              <div className="mt-3 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Wrench className="text-blue-600" size={18} />
                                  <h3 className="font-semibold text-gray-900">{removeMarkdown(msg.quickFix.title)}</h3>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{removeMarkdown(msg.quickFix.content)}</div>
                                {msg.quickFix.suggestions && (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Fix Suggestions:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                      {msg.quickFix.suggestions.map((suggestion, i) => (
                                        <li key={i}>{removeMarkdown(suggestion)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Search Results Display */}
                            {isBot && msg.searchResults && msg.searchResults.length > 0 && (
                              <div className="mt-3 space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Search className="text-green-600" size={18} />
                                    <h3 className="font-semibold text-gray-900">Found {msg.searchResults.length} similar resolved incident{msg.searchResults.length !== 1 ? 's' : ''}</h3>
                                  </div>
                                  <div className="space-y-3">
                                    {msg.searchResults.map((result, idx) => (
                                      <div key={idx} className="bg-white border border-green-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">#{idx + 1}. {result.title}</h4>
                                            <div className="text-sm text-gray-600 space-y-1">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle className="text-green-600" size={14} />
                                                <span className="font-medium">Resolution:</span>
                                                <span>{result.resolution}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <User className="text-gray-500" size={14} />
                                                <span className="font-medium">Resolved by:</span>
                                                <span>{result.resolvedBy}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="text-gray-500" size={14} />
                                                <span className="font-medium">Resolved at:</span>
                                                <span>{result.resolvedAt}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Image Attachments */}
                            {msg.attachments && msg.attachments.filter(a => a.type === 'image').length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.filter(a => a.type === 'image').map((att, attIndex) => (
                                  <motion.div
                                    key={attIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm max-w-md"
                                  >
                                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                                      <Paperclip size={14} />
                                      <span className="font-medium">{att.filename}</span>
                                    </div>
                                    {/* Image Preview */}
                                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 flex items-center justify-center">
                                      <div className="text-center w-full">
                                        {/* Simulated Dashboard Image */}
                                        <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg p-4 border-2 border-gray-300">
                                          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 rounded">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-2xl">🚨</span>
                                              <span className="font-bold text-red-700">Production Alert</span>
                                            </div>
                                            <div className="text-sm text-gray-700 space-y-1 font-mono">
                                              <div>Service: <span className="font-semibold">Payment Gateway</span></div>
                                              <div>Status: <span className="text-red-600 font-bold">DOWN</span></div>
                                              <div>Response Time: <span className="text-gray-500">N/A</span></div>
                                              <div>Uptime: <span className="text-red-600">0%</span></div>
                                              <div>Error: <span className="text-red-600">Connection refused</span></div>
                                            </div>
                                          </div>
                                          {att.content && (
                                            <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                                              {att.content}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded text-gray-500">
                <Plus size={18} />
              </button>
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-gray-400 text-sm">Message #incident-management</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded text-gray-500">
                <Paperclip size={18} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded text-gray-500">
                <Smile size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fix Modal */}
      <AnimatePresence>
        {quickFixModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQuickFixModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">🔧 Quick Fix Options</h2>
                  <button
                    onClick={() => setQuickFixModal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Current Incident: {quickFixModal.incident.text}</p>
              </div>
              <div className="p-6 space-y-3">
                {/* Helper function to check if option is available */}
                {(() => {
                  // Use messages prop (source of truth from App.jsx) for modal checks
                  const hasWebSearch = messages.some(m => 
                    m.quickFix && m.quickFix.incidentId === quickFixModal.incident.id && m.quickFix.title?.includes('Web Search')
                  )
                  const hasPastIncidents = messages.some(m => 
                    m.quickFix && m.quickFix.incidentId === quickFixModal.incident.id && m.quickFix.title?.includes('Past Incidents')
                  )
                  
                  // Determine which option should be highlighted
                  const shouldHighlightWebSearch = !hasWebSearch && !hasPastIncidents
                  const shouldHighlightPastIncidents = hasWebSearch && !hasPastIncidents
                  
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (!hasWebSearch) {
                            setQuickFixModal(null)
                            setLoadingIncidentId(quickFixModal.incident.id)
                            // Add 2 second delay before showing result
                            setTimeout(() => {
                              if (onQuickFixRequest) {
                                onQuickFixRequest({ method: 'web_search', incident: quickFixModal.incident })
                              }
                              setLoadingIncidentId(null)
                              // Scroll to incident header after result appears
                              setTimeout(() => {
                                const incidentCard = document.querySelector(`[data-incident-id="${quickFixModal.incident.id}"]`)
                                if (incidentCard) {
                                  incidentCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                                // Highlight next option after showing result
                                setHighlightedQuickFixOption(quickFixModal.incident.id)
                              }, 100)
                            }, 2000)
                          }
                        }}
                        disabled={hasWebSearch || loadingIncidentId === quickFixModal.incident.id}
                        type="button"
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center gap-3 text-left relative ${
                          shouldHighlightWebSearch
                            ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                            : hasWebSearch
                            ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        {shouldHighlightWebSearch && (
                          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 animate-bounce">
                            <ArrowRight className="text-yellow-600" size={20} />
                          </div>
                        )}
                        <Globe className={`${hasWebSearch ? 'text-gray-400' : 'text-blue-600'}`} size={24} />
                        <div className="flex-1">
                          <h3 className={`font-semibold ${hasWebSearch ? 'text-gray-500' : 'text-gray-900'}`}>
                            Web Search {hasWebSearch && '(Completed)'}
                          </h3>
                          <p className="text-sm text-gray-600">Search the web for similar issues and solutions</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          if (hasWebSearch && !hasPastIncidents) {
                            setQuickFixModal(null)
                            setLoadingIncidentId(quickFixModal.incident.id)
                            // Add 2 second delay before showing result
                            setTimeout(() => {
                              if (onQuickFixRequest) {
                                onQuickFixRequest({ method: 'past_incidents', incident: quickFixModal.incident })
                              }
                              setLoadingIncidentId(null)
                              // Scroll to incident header after result appears
                              setTimeout(() => {
                                const incidentCard = document.querySelector(`[data-incident-id="${quickFixModal.incident.id}"]`)
                                if (incidentCard) {
                                  incidentCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                              }, 100)
                            }, 2000)
                          }
                        }}
                        disabled={!hasWebSearch || hasPastIncidents || loadingIncidentId === quickFixModal.incident.id}
                        type="button"
                        className={`w-full p-4 border-2 rounded-lg transition-all flex items-center gap-3 text-left relative ${
                          shouldHighlightPastIncidents
                            ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                            : !hasWebSearch || hasPastIncidents
                            ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                        }`}
                      >
                        {shouldHighlightPastIncidents && (
                          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 animate-bounce">
                            <ArrowRight className="text-yellow-600" size={20} />
                          </div>
                        )}
                        <BookOpen className={`${!hasWebSearch || hasPastIncidents ? 'text-gray-400' : 'text-green-600'}`} size={24} />
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!hasWebSearch || hasPastIncidents ? 'text-gray-500' : 'text-gray-900'}`}>
                            Past Incidents {hasPastIncidents && '(Completed)'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {!hasWebSearch ? 'Complete Web Search first' : 'Find similar resolved incidents from history'}
                          </p>
                        </div>
                      </button>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SlackSimulator
