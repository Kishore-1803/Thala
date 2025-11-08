import { SkipForward, SkipBack, RotateCcw, MessageCircle, Ticket, ArrowRight, Sparkles } from 'lucide-react'

function DemoController({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onReset,
  stepDescription,
  currentView,
  onViewChange,
  stepHighlights,
  canProceed = true,
  theme = 'light'
}) {
  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Step Description */}
        {stepDescription && (
          <div className={`mb-4 p-4 border-l-4 rounded ${
            theme === 'dark' 
              ? 'bg-blue-900/20 border-blue-500' 
              : 'bg-blue-50 border-blue-500'
          }`}>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>{stepDescription}</p>
          </div>
        )}

        {/* Highlights Section */}
        {stepHighlights && stepHighlights.length > 0 && (
          <div className={`mb-4 p-4 border rounded-lg ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700' 
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} size={18} />
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Key Highlights</h3>
            </div>
            <div className="space-y-2">
              {stepHighlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ArrowRight className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} flex-shrink-0 mt-0.5`} size={16} />
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Reset Demo"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={onPrevious}
              disabled={currentStep === 0}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Previous Step"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={onNext}
              disabled={currentStep === totalSteps - 1 || !canProceed}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                !canProceed || currentStep === totalSteps - 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={!canProceed ? "Waiting for messages to load" : "Next Step"}
            >
              <SkipForward size={20} />
              <span className="text-sm font-medium">Next</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher */}
            <div className={`flex items-center gap-2 rounded-lg p-1 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <button
                onClick={() => onViewChange('slack')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'slack'
                    ? theme === 'dark'
                      ? 'bg-gray-600 text-white shadow-sm'
                      : 'bg-white text-slack-purple shadow-sm'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle size={16} />
                Slack
              </button>
              <button
                onClick={() => onViewChange('jira')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'jira'
                    ? theme === 'dark'
                      ? 'bg-gray-600 text-white shadow-sm'
                      : 'bg-white text-jira-blue shadow-sm'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Ticket size={16} />
                Jira
              </button>
            </div>

            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">{currentStep + 1}</span> / {totalSteps}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoController
