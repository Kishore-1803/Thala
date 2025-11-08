import { useState, useEffect } from 'react'
import { Bot, Sparkles, Search, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function ThalaBotPanel({ responses, currentStep, stepData }) {
  const [displayedResponses, setDisplayedResponses] = useState([])

  useEffect(() => {
    if (responses.length > 0) {
      setDisplayedResponses(responses)
    }
  }, [responses])

  const getResponseTypeIcon = (type) => {
    switch (type) {
      case 'incident_detected':
        return <AlertCircle size={16} className="text-red-600" />
      case 'resolution':
        return <CheckCircle size={16} className="text-green-600" />
      case 'search':
        return <Search size={16} className="text-blue-600" />
      case 'quick_fix':
        return <Sparkles size={16} className="text-purple-600" />
      default:
        return <Bot size={16} className="text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[400px] flex flex-col">
      {/* Thala Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h2 className="font-semibold">Thala Bot Activity</h2>
        </div>
        <div className="text-xs text-purple-200">
          {displayedResponses.length} action{displayedResponses.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Responses List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {displayedResponses.map((response, index) => (
            <motion.div
              key={response.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Response Header */}
              <div className="flex items-center gap-2 mb-2">
                {getResponseTypeIcon(response.type)}
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  {response.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Response Content */}
              <div className="text-sm text-gray-800">
                {response.title && (
                  <div className="font-semibold mb-1">{response.title}</div>
                )}
                {response.content && (
                  <div className="whitespace-pre-wrap">{response.content}</div>
                )}
                
                {/* Incident Details */}
                {response.incident && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <div className="text-xs space-y-1">
                      <div><span className="font-semibold">ID:</span> {response.incident.id}</div>
                      {response.incident.category && (
                        <div><span className="font-semibold">Category:</span> {response.incident.category}</div>
                      )}
                      {response.incident.severity && (
                        <div><span className="font-semibold">Severity:</span> {response.incident.severity}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {response.searchResults && response.searchResults.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs font-semibold text-gray-700">Found {response.searchResults.length} similar incidents:</div>
                    {response.searchResults.map((result, resultIndex) => (
                      <div key={resultIndex} className="text-xs p-2 bg-white rounded border border-gray-200">
                        <div className="font-semibold">{result.title}</div>
                        {result.resolution && (
                          <div className="text-gray-600 mt-1">{result.resolution}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Fix Suggestions */}
                {response.suggestions && response.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-700">Fix Suggestions:</div>
                    {response.suggestions.map((suggestion, sugIndex) => (
                      <div key={sugIndex} className="text-xs p-2 bg-white rounded border-l-2 border-purple-500">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ThalaBotPanel






