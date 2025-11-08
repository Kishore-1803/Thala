import { useState, useEffect } from 'react'
import { Ticket, AlertCircle, CheckCircle, Clock, User, Paperclip } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function JiraSimulator({ tickets, currentStep, stepData }) {
  const [displayedTickets, setDisplayedTickets] = useState([])

  useEffect(() => {
    if (tickets.length > 0) {
      setDisplayedTickets(tickets)
    }
  }, [tickets])

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800 border-red-300',
      'High': 'bg-orange-100 text-orange-800 border-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-blue-100 text-blue-800 border-blue-300'
    }
    return colors[priority] || colors['Medium']
  }

  const getStatusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle size={16} className="text-green-600" />
    if (status === 'Open') return <AlertCircle size={16} className="text-orange-600" />
    return <Clock size={16} className="text-gray-600" />
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[400px] flex flex-col">
      {/* Jira Header */}
      <div className="bg-jira-blue text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={20} />
          <h2 className="font-semibold">Jira Issues</h2>
        </div>
        <div className="text-xs text-blue-200">
          {displayedTickets.length} ticket{displayedTickets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {displayedTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <span className="font-semibold text-gray-900">{ticket.key}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>

              {/* Ticket Title */}
              <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>

              {/* Ticket Description */}
              {ticket.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
              )}

              {/* Ticket Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{ticket.assignee || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip size={12} />
                    <span>{ticket.attachments.length}</span>
                  </div>
                )}
              </div>

              {/* Resolution Info */}
              {ticket.status === 'Resolved' && ticket.resolution && (
                <div className="mt-2 p-2 bg-green-50 border-l-4 border-green-500 rounded text-xs">
                  <div className="font-semibold text-green-900 mb-1">Resolution:</div>
                  <div className="text-green-800">{ticket.resolution}</div>
                  {ticket.resolvedBy && (
                    <div className="text-green-700 mt-1">Resolved by: {ticket.resolvedBy}</div>
                  )}
                </div>
              )}

              {/* Comments */}
              {ticket.comments && ticket.comments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {ticket.comments.map((comment, commentIndex) => (
                    <div key={commentIndex} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-semibold">{comment.author}:</span> {comment.text}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default JiraSimulator






