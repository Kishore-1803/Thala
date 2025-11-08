import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Ticket, AlertCircle, CheckCircle, Clock, User, Paperclip, Edit, MessageSquare, Plus, X, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MouseCursor from './MouseCursor'

function JiraFullView({ tickets, activeTicket, currentStep, stepData, onBackToSlack, isCreating, theme = 'light' }) {
  const [displayedTickets, setDisplayedTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(activeTicket)
  const [showCreateForm, setShowCreateForm] = useState(isCreating || false)
  const [mouseCursor, setMouseCursor] = useState({ visible: false, position: { x: 0, y: 0 } })
  const containerRef = useRef(null)
  const createButtonRef = useRef(null)
  const resolveButtonRef = useRef(null)
  
  // Typing animation state
  const [typingState, setTypingState] = useState({
    summary: '',
    description: '',
    priority: '',
    assignee: '',
    isTyping: false
  })
  
  const formData = {
    summary: "User authentication failing for admin accounts",
    description: 'Multiple reports of admin users unable to login. Getting "401 Unauthorized" errors even with correct credentials.',
    priority: "High",
    assignee: "Sarah"
  }
  
  // Typing animation effect
  useEffect(() => {
    if (showCreateForm && isCreating) {
      setTypingState({ summary: '', description: '', priority: '', assignee: '', isTyping: true })
      
      // Type summary
      let summaryIndex = 0
      const typeSummary = () => {
        if (summaryIndex < formData.summary.length) {
          setTypingState(prev => ({
            ...prev,
            summary: formData.summary.substring(0, summaryIndex + 1)
          }))
          summaryIndex++
          setTimeout(typeSummary, 50)
        } else {
          // Type description
          let descIndex = 0
          const typeDescription = () => {
            if (descIndex < formData.description.length) {
              setTypingState(prev => ({
                ...prev,
                description: formData.description.substring(0, descIndex + 1)
              }))
              descIndex++
              setTimeout(typeDescription, 30)
            } else {
              // Set priority and assignee
              setTypingState(prev => ({
                ...prev,
                priority: formData.priority,
                assignee: formData.assignee,
                isTyping: false
              }))
            }
          }
          setTimeout(typeDescription, 500)
        }
      }
      setTimeout(typeSummary, 1000)
    }
  }, [showCreateForm, isCreating])

  useEffect(() => {
    if (tickets.length > 0) {
      setDisplayedTickets(tickets)
      if (!selectedTicket && tickets.length > 0) {
        setSelectedTicket(tickets[tickets.length - 1])
      }
    }
  }, [tickets])

  useEffect(() => {
    if (activeTicket) {
      setSelectedTicket(activeTicket)
    }
  }, [activeTicket])

  useEffect(() => {
    if (isCreating !== undefined) {
      setShowCreateForm(isCreating)
    }
  }, [isCreating])

  // Mouse cursor animation for creating tickets
  useEffect(() => {
    if (isCreating && createButtonRef.current && containerRef.current) {
      const buttonRect = createButtonRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Animate cursor moving to create button
      setMouseCursor({
        visible: true,
        position: {
          x: buttonRect.left + buttonRect.width / 2 - containerRect.left,
          y: buttonRect.top + buttonRect.height / 2 - containerRect.top
        }
      })

      // After clicking, animate to form fields
      setTimeout(() => {
        const formInput = containerRef.current?.querySelector('input[type="text"]')
        if (formInput) {
          const inputRect = formInput.getBoundingClientRect()
          setMouseCursor({
            visible: true,
            position: {
              x: inputRect.left + inputRect.width / 2 - containerRect.left,
              y: inputRect.top + inputRect.height / 2 - containerRect.top
            }
          })
        }
      }, 1000)

      // Hide cursor after animation
      setTimeout(() => {
        setMouseCursor({ visible: false, position: { x: 0, y: 0 } })
      }, 3000)
    }
  }, [isCreating])

  // Mouse cursor animation for resolving tickets
  useEffect(() => {
    if (selectedTicket && selectedTicket.status === 'Resolved' && resolveButtonRef.current && containerRef.current) {
      const buttonRect = resolveButtonRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Animate cursor clicking resolve button
      setMouseCursor({
        visible: true,
        position: {
          x: buttonRect.left + buttonRect.width / 2 - containerRect.left,
          y: buttonRect.top + buttonRect.height / 2 - containerRect.top
        }
      })

      setTimeout(() => {
        setMouseCursor({ visible: false, position: { x: 0, y: 0 } })
      }, 2000)
    }
  }, [selectedTicket])

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800 border-red-300',
      'High': 'bg-orange-100 text-orange-800 border-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-blue-100 text-blue-800 border-blue-300'
    }
    return colors[priority] || colors['Medium']
  }

  const getStatusColor = (status) => {
    if (status === 'Resolved') return 'bg-green-100 text-green-800'
    if (status === 'Open') return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-xl overflow-hidden h-[800px] flex flex-col border border-gray-200 relative">
      <MouseCursor position={mouseCursor.position} visible={mouseCursor.visible} />
      {/* Jira Header */}
      <div className="bg-jira-blue text-white px-6 py-4 flex items-center justify-between border-b border-blue-600">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToSlack}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Back to Slack"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <Ticket size={24} />
            <div>
              <h1 className="text-xl font-bold">Jira</h1>
              <p className="text-xs text-blue-200">Issue Tracking</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            ref={createButtonRef}
            onClick={() => setShowCreateForm(true)}
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2 font-medium opacity-50"
            title="Demo mode - Ticket creation is disabled"
          >
            <Plus size={16} />
            Create Issue
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Ticket List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="font-semibold text-gray-900 mb-2">Issues</h2>
            <div className="text-sm text-gray-600">{displayedTickets.length} issue{displayedTickets.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="p-2 space-y-2">
            <AnimatePresence>
              {displayedTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setSelectedTicket(ticket)
                    setShowCreateForm(false)
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ticket.status === 'Resolved' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <AlertCircle size={16} className="text-orange-600" />
                      )}
                      <span className="font-semibold text-gray-900">{ticket.key}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{ticket.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>{ticket.assignee || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content - Ticket Details */}
        <div className="flex-1 overflow-y-auto bg-white">
          {showCreateForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 max-w-4xl mx-auto"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Issue</h2>
                <p className="text-gray-600">Fill in the details to create a new Jira ticket</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    value={typingState.summary}
                    placeholder={typingState.isTyping ? "Typing..." : "Enter issue summary..."}
                  />
                  {typingState.isTyping && typingState.summary.length < formData.summary.length && (
                    <span className="inline-block ml-2 w-2 h-5 bg-jira-blue animate-pulse">|</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={6}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 resize-none"
                    value={typingState.description}
                    placeholder={typingState.isTyping ? "Typing..." : "Enter issue description..."}
                  />
                  {typingState.isTyping && typingState.description.length < formData.description.length && (
                    <span className="inline-block ml-2 w-2 h-5 bg-jira-blue animate-pulse">|</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select 
                      value={typingState.priority || ""} 
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    >
                      <option value="">Select priority...</option>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={typingState.assignee}
                      placeholder={typingState.isTyping ? "Typing..." : "Enter assignee..."}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    disabled
                    className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2 font-medium opacity-50"
                    title="Demo mode - Ticket creation is disabled"
                  >
                    <Save size={16} />
                    Create Issue
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ) : selectedTicket ? (
            <motion.div
              key={selectedTicket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 max-w-4xl mx-auto"
            >
              {/* Ticket Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-900">{selectedTicket.key}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedTicket.title}</h1>
                  </div>
                  <button ref={resolveButtonRef} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit size={18} className="text-gray-600" />
                  </button>
                </div>

                {/* Ticket Meta */}
                <div className="flex items-center gap-6 text-sm text-gray-600 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span><strong>Assignee:</strong> {selectedTicket.assignee || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} />
                      <span>{selectedTicket.attachments.length} attachment{selectedTicket.attachments.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Resolution */}
              {selectedTicket.status === 'Resolved' && selectedTicket.resolution && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Resolution</h3>
                  </div>
                  <p className="text-green-800 mb-2">{selectedTicket.resolution}</p>
                  {selectedTicket.resolvedBy && (
                    <p className="text-sm text-green-700">Resolved by: {selectedTicket.resolvedBy}</p>
                  )}
                </div>
              )}

              {/* Comments */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
                  <button className="px-4 py-2 bg-jira-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                    <Plus size={16} />
                    Add Comment
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((comment, commentIndex) => (
                      <div key={commentIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {comment.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{comment.author}</div>
                            <div className="text-xs text-gray-500">
                              {comment.timestamp 
                                ? new Date(comment.timestamp).toLocaleString()
                                : new Date(selectedTicket.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <Paperclip size={14} />
                            <span>{comment.attachments.length} attachment{comment.attachments.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JiraFullView

