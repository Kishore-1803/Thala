import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import DemoController from './components/DemoController'
import SlackSimulator from './components/SlackSimulator'
import JiraFullView from './components/JiraFullView'
import { demoScript } from './data/demoScript'

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [slackMessages, setSlackMessages] = useState([])
  const [jiraTickets, setJiraTickets] = useState([])
  const [currentView, setCurrentView] = useState('slack')
  const [activeJiraTicket, setActiveJiraTicket] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [displayedMessages, setDisplayedMessages] = useState([])
  const [messageQueue, setMessageQueue] = useState([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [resolvedIncidentIds, setResolvedIncidentIds] = useState(new Set())
  const [completedQuickFixActions, setCompletedQuickFixActions] = useState(new Set()) // Track completed Quick Fix actions
  const [expectedMessagesForStep, setExpectedMessagesForStep] = useState(0) // Track expected messages for current step
  const [showWelcomeModal, setShowWelcomeModal] = useState(true) // Show welcome popup on start
  const [theme, setTheme] = useState('light') // Theme state: 'light' or 'dark'
  const intervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const messageTimeoutRef = useRef(null)
  const displayedMessageIdsRef = useRef(new Set())
  const messageQueueRef = useRef([])
  const isProcessingQueueRef = useRef(false)

  // Check if demoScript is loaded
  if (!demoScript || demoScript.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Demo...</h1>
          <p className="text-gray-600">Please wait while the demo script loads.</p>
        </div>
      </div>
    )
  }

  const currentStepData = demoScript[currentStep] || demoScript[0]

  // Play sound effect for new messages
  const playMessageSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      // Ignore audio errors
    }
  }

  const handleNext = () => {
    if (currentStep < demoScript.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
    setDisplayedMessages([])
    setMessageQueue([])
    setIsProcessingQueue(false)
    setJiraTickets([])
    setCurrentView('slack')
    setActiveJiraTicket(null)
    setTypingUsers([])
    setResolvedIncidentIds(new Set())
    setCompletedQuickFixActions(new Set())
    setExpectedMessagesForStep(0)
    setShowWelcomeModal(true)
    displayedMessageIdsRef.current.clear()
    messageQueueRef.current = []
    isProcessingQueueRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
      messageTimeoutRef.current = null
    }
  }

  // Initial load - ensure messages from step 0 are queued on mount
  useEffect(() => {
    console.log('[INIT] Initial load effect running')
    const stepData = demoScript.find(s => s.step === 0) || demoScript[0]
    if (stepData) {
      console.log('[INIT] Step 0 data found:', stepData)
      const initialMessages = []
      if (stepData.slack) {
        console.log('[INIT] Adding slack messages:', stepData.slack.length)
        initialMessages.push(...stepData.slack)
      }
      if (stepData.thala) {
        console.log('[INIT] Adding thala responses:', stepData.thala.length)
        stepData.thala.forEach(thalaResponse => {
          const botMessage = {
            id: thalaResponse.id,
            userId: 'thala',
            userName: 'Thala Bot',
            text: thalaResponse.content || thalaResponse.title,
            timestamp: thalaResponse.timestamp,
            isBot: true
          }
          if (thalaResponse.type === 'incidents_list' && thalaResponse.incidents) {
            botMessage.incidents = thalaResponse.incidents
          }
          if (thalaResponse.type === 'search' && thalaResponse.searchResults) {
            botMessage.searchResults = thalaResponse.searchResults
          }
          if (thalaResponse.type === 'resolution' && thalaResponse.incident) {
            botMessage.isResolution = true
            botMessage.resolutionIncidentId = thalaResponse.incident.id
          }
          if (thalaResponse.type === 'quick_fix') {
            botMessage.quickFix = {
              title: thalaResponse.title,
              content: thalaResponse.content,
              suggestions: thalaResponse.suggestions
            }
          }
          initialMessages.push(botMessage)
        })
      }
      if (initialMessages.length > 0) {
        console.log('[INIT] Setting message queue with', initialMessages.length, 'messages:', initialMessages.map(m => m.id))
        messageQueueRef.current = initialMessages
        setMessageQueue(initialMessages)
        // Trigger processing after a short delay to ensure state is set
        setTimeout(() => {
          if (!isProcessingQueueRef.current) {
            console.log('[INIT] Triggering processNextMessage from initial load')
            processNextMessage()
          }
        }, 100)
      } else {
        console.log('[INIT] No initial messages found!')
      }
    } else {
      console.log('[INIT] No step 0 data found!')
    }
  }, []) // Run only once on mount

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < demoScript.length - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 5000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying])

  // Get Quick Fix response based on method
  const getQuickFixResponse = (method, incident) => {
    const responses = {
      web_search: {
        title: '🔧 Quick Fix: Web Search',
        content: `Current Incident:
Jira [JIRA-1234]: ${incident.text} at ${new Date(incident.timestamp).toISOString()}. Reporter: Sarah. Description: Multiple reports of admin users unable to login. Getting "401 Unauthorized" errors even with correct credentials.

🌐 Found 3 relevant web resources

Fix Suggestions:

Root Cause Analysis
The root cause of the user authentication failing for admin accounts is likely related to an issue with the authentication mechanism, such as incorrect credentials, misconfigured authentication settings, or a problem with the authentication server. The fact that the issue is specific to admin accounts suggests that it might be related to a specific configuration or permission setting.

Immediate Fix Steps
1. Verify Credentials: Double-check that the admin account credentials are correct and have not been changed recently.
2. Check Authentication Settings: Review the authentication settings to ensure that they are configured correctly, including the authentication protocol, API keys, and permission settings.
3. Test Authentication: Use a tool like curl to test the authentication mechanism to isolate the issue.
4. Verify API Key Configuration: If using API keys for authentication, verify that they are configured correctly.
5. Check Server Configuration: Verify that the server is configured correctly, including the authentication server and permission settings.
6. Restart Service: If none of the above steps resolve the issue, try restarting the service to ensure that any configuration changes are applied.

Best Practices
1. Regularly Review Authentication Settings: Periodically review authentication settings to ensure they are up-to-date and correctly configured.
2. Use Secure Authentication Protocols: Use secure authentication protocols, such as OAuth or API keys.
3. Implement Robust Password Management: Implement robust password management practices, including regular password rotation.
4. Monitor Authentication Logs: Regularly monitor authentication logs to detect and respond to potential security incidents.
5. Test Authentication Mechanisms: Regularly test authentication mechanisms to ensure they are working correctly and securely.

📋 Reference: Top Web Resources
#1 curl requests to JIRA log in as anonymous user even w/ valid credentials
https://stackoverflow.com/questions/30852852/curl-requests-to-jira-log-in-as-anonymous-user-even-w-valid-credentials

#2 Basic authentication error while using Python-jira using api key
https://stackoverflow.com/questions/60388895/basic-authentication-error-while-using-python-jira-using-api-key

#3 Python JIRA Package cant authenticate against Jira server
https://stackoverflow.com/questions/77083001/python-jira-package-cant-authenticate-against-jira-server`,
        suggestions: [
          'Verify Credentials: Double-check that the admin account credentials are correct',
          'Check Authentication Settings: Review the authentication settings to ensure correct configuration',
          'Test Authentication: Use curl to test the authentication mechanism',
          'Verify API Key Configuration: If using API keys, verify they are configured correctly',
          'Check Server Configuration: Verify server configuration including authentication server settings',
          'Restart Service: Try restarting the service to apply configuration changes'
        ]
      },
      past_incidents: {
        title: '🔧 Quick Fix: Past Incidents',
        content: `Current Incident:
Jira [JIRA-1234]: ${incident.text} at ${new Date(incident.timestamp).toISOString()}. Reporter: Sarah. Description: Multiple reports of admin users unable to login. Getting "401 Unauthorized" errors even with correct credentials.

📚 Found 6 similar resolved incidents

Fix Suggestions:

Root Cause Analysis
Based on the information provided, the root cause of the current incident appears to be related to an authentication issue affecting admin accounts. Given that similar past incidents have been resolved, it's likely that the issue stems from a common source, such as a misconfiguration, a bug in the authentication system, or an issue with the user database.

Immediate Fix Steps
1. Verify Authentication Configuration: Check the authentication system's configuration to ensure that it is correctly set up for admin accounts. This includes verifying any recent changes to the configuration.
2. Check User Database Integrity: Ensure that the user database, which stores information about admin accounts, is intact and not corrupted.
3. Review Role-Based Access Control (RBAC) Settings: Examine the RBAC settings to confirm that admin accounts have the appropriate permissions and access levels.
4. Apply Previous Fix: Since similar issues were fixed in the past, review the resolution steps taken for those incidents and apply them to the current situation if applicable.
5. Test Authentication: After applying any fixes, thoroughly test the authentication system with admin accounts to ensure that the issue is fully resolved.

Prevention Measures
1. Regular Configuration Backups: Implement a regular backup schedule for the authentication system's configuration.
2. Automated Integrity Checks: Set up automated checks for the user database to detect any corruption or inconsistencies early.
3. Access Control Reviews: Periodically review RBAC settings to ensure they are appropriate and have not been inadvertently changed.
4. Change Management Process: Establish or reinforce a change management process that includes thorough testing of any changes to the authentication system.
5. Monitoring and Alerting: Enhance monitoring of the authentication system to quickly detect and alert on any authentication failures.

📋 Reference: Top Resolved Incidents
#1 Resolution: Admin authentication timeout resolved by increasing Redis connection pool size from 10 to 50. Auth service was unable to handle concurrent admin login requests. Resolved by: Sarah (DevOps) on 2025-10-15
#2 Resolution: Admin login failures fixed by updating auth service configuration after Redis port change from 6379 to 6380. Service discovery was not updated automatically. Resolved by: Mike (Backend Dev) on 2025-10-10
#3 Resolution: Admin account access restored by clearing corrupted session cache in Redis and restarting authentication service. Session tokens were invalid due to cache corruption. Resolved by: John (Team Lead) on 2025-09-28`,
        suggestions: [
          'Verify Authentication Configuration: Check the authentication system configuration for admin accounts',
          'Check User Database Integrity: Ensure the user database is intact and not corrupted',
          'Review RBAC Settings: Examine role-based access control settings for admin accounts',
          'Apply Previous Fix: Review and apply resolution steps from similar past incidents',
          'Test Authentication: Thoroughly test the authentication system after applying fixes'
        ]
      },
      combined: {
        title: '🔧 Quick Fix: Combined Analysis',
        content: `Current Incident:
Jira [JIRA-1234]: ${incident.text} at ${new Date(incident.timestamp).toISOString()}. Reporter: Sarah. Description: Multiple reports of admin users unable to login. Getting "401 Unauthorized" errors even with correct credentials.

📊 Combined Analysis
📚 Past Incidents: 6 found
🌐 Web Resources: 3 found

Root Cause Analysis
Based on past incidents and web resources, admin authentication failures are commonly caused by:
1. Redis cache connection issues (seen in 3 past incidents)
2. Database timeout during credential verification (seen in 2 past incidents)
3. Misconfigured authentication settings (common in web resources)
4. API key or session token validation failures

Immediate Fix Steps
1. Check Redis Cache Service: Verify Redis is running and accessible on the correct port (most common issue from past incidents)
2. Verify Database Connection Pool: Check database connection pool for auth service - ensure it's not exhausted
3. Review Recent Configuration Changes: Check for any recent changes to auth service configuration, especially Redis port or connection settings
4. Test Authentication Endpoint: Use curl to test the authentication endpoint directly
5. Clear Admin User Sessions: Clear existing admin user sessions and retry authentication
6. Restart Auth Service: If configuration changes were made, restart the auth service to apply changes

Best Practices & Prevention
1. Configuration Management: Use version control for authentication configuration and implement automated testing before deployment
2. Service Discovery: Implement proper service discovery to avoid hardcoded ports and connection strings
3. Monitoring: Set up alerts for authentication failures, especially for admin accounts
4. Regular Audits: Periodically audit authentication settings and RBAC configurations
5. Documentation: Maintain clear documentation of authentication architecture and common issues`,
        suggestions: [
          'Check Redis Cache Service: Verify Redis is running and accessible on the correct port',
          'Verify Database Connection Pool: Check database connection pool for auth service',
          'Review Recent Configuration Changes: Check for recent changes to auth service configuration',
          'Test Authentication Endpoint: Use curl to test the authentication endpoint directly',
          'Clear Admin User Sessions: Clear existing admin user sessions and retry authentication',
          'Restart Auth Service: Restart the auth service to apply configuration changes'
        ]
      }
    }
    
    return responses[method] || responses.web_search
  }

  // Handle Quick Fix request
  const handleQuickFixRequest = ({ method, incident }) => {
    console.log('[QUICKFIX] Request received:', method, 'for incident:', incident.id)
    // Show Quick Fix response after delay (handled in SlackSimulator)
    setDisplayedMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.incidents && msg.incidents.some(inc => inc.id === incident.id)) {
          const quickFixData = getQuickFixResponse(method, incident)
          console.log('[QUICKFIX] Adding Quick Fix to message:', msg.id, 'Quick Fix title:', quickFixData.title)
          
          // Mark the action as completed
          const actionKey = `${incident.id}-${method}`
          setCompletedQuickFixActions(prevActions => {
            const newSet = new Set([...prevActions, actionKey])
            console.log('[QUICKFIX] Marked action as completed:', actionKey, 'Total completed:', newSet.size)
            return newSet
          })
          
          // Auto-advance to Past Incidents step (step 11) after Web Search result appears
          if (method === 'web_search') {
            setTimeout(() => {
              console.log('[QUICKFIX] Auto-advancing to Past Incidents step (11) after Web Search')
              // Find step 11 (Past Incidents)
              const pastIncidentsStep = demoScript.findIndex(s => s.step === 11)
              if (pastIncidentsStep >= 0) {
                setCurrentStep(pastIncidentsStep)
              }
            }, 2500) // Wait 2.5 seconds after result appears (2s delay + 0.5s buffer)
          }
          
          return {
            ...msg,
            quickFix: {
              ...quickFixData,
              incidentId: incident.id
            }
          }
        }
        return msg
      })
      console.log('[QUICKFIX] Updated messages count:', updated.length)
      return updated
    })
    playMessageSound()
  }
  
  // Check if current step requires Quick Fix actions and if they're completed
  // Also check if all messages for current step have been displayed
  const canProceedToNextStep = () => {
    const stepData = demoScript[currentStep]
    if (!stepData) return true
    
    // Check if all messages for current step have been displayed
    if (expectedMessagesForStep > 0) {
      // Count how many messages from current step have been displayed
      const currentStepData = demoScript[currentStep]
      const currentStepMessageIds = new Set()
      if (currentStepData) {
        if (currentStepData.slack) {
          currentStepData.slack.forEach(msg => currentStepMessageIds.add(msg.id))
        }
        if (currentStepData.thala) {
          currentStepData.thala.forEach(thala => {
            // Only count thala responses that create new messages (not Quick Fix with incidentId)
            if (!(thala.type === 'quick_fix' && thala.incidentId)) {
              currentStepMessageIds.add(thala.id)
            }
          })
        }
      }
      
      // Check if all expected messages are displayed
      const displayedCount = Array.from(currentStepMessageIds).filter(id => 
        displayedMessageIdsRef.current.has(id)
      ).length
      
      if (displayedCount < expectedMessagesForStep) {
        console.log('[LOCK] Step', currentStep, 'has', displayedCount, 'of', expectedMessagesForStep, 'messages displayed')
        return false
      }
    }
    
    // Check if this step requires Quick Fix actions based on description
    const description = stepData.description || ''
    const requiresWebSearch = description.includes('Web Search')
    const requiresPastIncidents = description.includes('Past Incidents')
    
    if (requiresWebSearch || requiresPastIncidents) {
      // Check if the required action has been completed
      // We need to check if any Quick Fix with the expected method has been completed
      const hasWebSearch = Array.from(completedQuickFixActions).some(key => key.includes('web_search'))
      const hasPastIncidents = Array.from(completedQuickFixActions).some(key => key.includes('past_incidents'))
      
      if (requiresWebSearch && !hasWebSearch) {
        console.log('[LOCK] Step requires Web Search, but not completed yet')
        return false
      }
      if (requiresPastIncidents && !hasPastIncidents) {
        console.log('[LOCK] Step requires Past Incidents, but not completed yet')
        return false
      }
    }
    
    return true
  }

  // Update refs when state changes
  useEffect(() => {
    messageQueueRef.current = messageQueue
  }, [messageQueue])

  useEffect(() => {
    isProcessingQueueRef.current = isProcessingQueue
  }, [isProcessingQueue])

  // Function to process next message
  const processNextMessage = useCallback(() => {
    // Check using ref to avoid stale closure
    if (isProcessingQueueRef.current) {
      console.log('[QUEUE] Already processing, skipping')
      return
    }

    const queue = messageQueueRef.current
    if (queue.length === 0) {
      console.log('[QUEUE] Queue is empty, skipping')
      return
    }

    console.log('[QUEUE] Starting to process message:', queue[0].id)
    setIsProcessingQueue(true)
    isProcessingQueueRef.current = true
    const nextMessage = queue[0]
    
    // Show typing indicator for user messages
    if (nextMessage.userId !== 'thala' && nextMessage.userName) {
      console.log('[QUEUE] Showing typing indicator for:', nextMessage.userName)
      setTypingUsers([nextMessage.userName])
    }
    
    // Wait before showing the message
    const delay = nextMessage.userId === 'thala' ? 1500 : 800
    console.log('[QUEUE] Will display message after', delay, 'ms')
    
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    
    const timeoutId = setTimeout(() => {
      console.log('[QUEUE] Displaying message:', nextMessage.id)
      setTypingUsers([])
      setDisplayedMessages(prev => {
        const newMessages = [...prev, nextMessage]
        console.log('[QUEUE] Updated displayed messages. Total:', newMessages.length)
        displayedMessageIdsRef.current.add(nextMessage.id)
        return newMessages
      })
      playMessageSound()
      
      // Check if this is a resolution message
      if (nextMessage.isResolution && nextMessage.resolutionIncidentId) {
        // Mark incident as resolved after showing the message
        setTimeout(() => {
          setResolvedIncidentIds(prev => new Set([...prev, nextMessage.resolutionIncidentId]))
          // After showing resolution, wait and transition to Jira
          const stepData = demoScript[currentStep]
          setTimeout(() => {
            if (stepData?.viewTransition?.view === 'jira' || stepData?.jira) {
              setCurrentView('jira')
            }
          }, 2000)
        }, 1000)
      }
      
      // Remove processed message from queue
      setMessageQueue(prev => {
        const newQueue = prev.slice(1)
        console.log('[QUEUE] Removed message from queue. Remaining:', newQueue.length)
        // Update ref immediately
        messageQueueRef.current = newQueue
        return newQueue
      })
      
      // Reset processing flag after a short delay to allow next message
      setTimeout(() => {
        console.log('[QUEUE] Resetting processing flag')
        setIsProcessingQueue(false)
        isProcessingQueueRef.current = false
        // Try to process next message - use setTimeout to ensure state is updated
        setTimeout(() => {
          processNextMessage()
        }, 100)
      }, 200)
    }, delay)
    
    messageTimeoutRef.current = timeoutId
  }, [])

  // Process messages when queue has items and we're ready
  useEffect(() => {
    console.log('[QUEUE] Effect triggered. Queue length:', messageQueue.length, 'isProcessing:', isProcessingQueue)
    if (messageQueue.length > 0 && !isProcessingQueue && !isProcessingQueueRef.current) {
      console.log('[QUEUE] Triggering processNextMessage')
      // Use setTimeout to avoid dependency issues
      setTimeout(() => {
        processNextMessage()
      }, 0)
    }
  }, [messageQueue.length, isProcessingQueue, processNextMessage])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        console.log('[QUEUE] Component unmounting, cleaning up timeout')
        clearTimeout(messageTimeoutRef.current)
        messageTimeoutRef.current = null
      }
    }
  }, [])

  // Build message queue when step changes
  useEffect(() => {
    console.log('[STEP] Step changed to:', currentStep)
    const allSlackMessages = []
    const allJiraTickets = []
    
    // Calculate expected messages for current step only
    const currentStepData = demoScript[currentStep]
    let expectedCount = 0
    if (currentStepData) {
      if (currentStepData.slack) expectedCount += currentStepData.slack.length
      if (currentStepData.thala) {
        // Count thala responses that will create new messages (not Quick Fix with incidentId)
        currentStepData.thala.forEach(thalaResponse => {
          if (thalaResponse.type === 'quick_fix' && thalaResponse.incidentId) {
            // This will be added to existing message, so don't count
          } else {
            expectedCount += 1
          }
        })
      }
    }
    setExpectedMessagesForStep(expectedCount)
    console.log('[STEP] Expected messages for step', currentStep, ':', expectedCount)
    
    // Start from step 0 (skip welcome step -1 as it's shown as popup)
    for (let i = 0; i <= currentStep; i++) {
      const stepData = demoScript[i]
      if (stepData) {
        if (stepData.slack) {
          console.log('[STEP] Step', i, 'has', stepData.slack.length, 'slack messages')
          allSlackMessages.push(...stepData.slack)
        }
        if (stepData.jira) {
          // Update existing tickets or add new ones
          stepData.jira.forEach(newTicket => {
            const existingIndex = allJiraTickets.findIndex(t => t.id === newTicket.id || t.key === newTicket.key)
            if (existingIndex >= 0) {
              // Update existing ticket (merge comments, update status, etc.)
              const existing = allJiraTickets[existingIndex]
              allJiraTickets[existingIndex] = {
                ...existing,
                ...newTicket,
                // Merge comments if both have them
                comments: newTicket.comments 
                  ? [...(existing.comments || []), ...newTicket.comments]
                  : existing.comments
              }
            } else {
              // Add new ticket
              allJiraTickets.push(newTicket)
            }
          })
        }
        // Add Thala responses as Slack messages
        if (stepData.thala) {
          console.log('[STEP] Step', i, 'has', stepData.thala.length, 'thala responses')
          stepData.thala.forEach(thalaResponse => {
            // If Quick Fix has incidentId, add it to the existing incidents_list message
            if (thalaResponse.type === 'quick_fix' && thalaResponse.incidentId) {
              // Find the message with this incident
              const incidentsListMessage = allSlackMessages.find(msg => 
                msg.incidents && msg.incidents.some(inc => inc.id === thalaResponse.incidentId)
              )
              if (incidentsListMessage) {
                // Add Quick Fix to the existing message
                incidentsListMessage.quickFix = {
                  title: thalaResponse.title,
                  content: thalaResponse.content,
                  suggestions: thalaResponse.suggestions,
                  incidentId: thalaResponse.incidentId
                }
                console.log('[STEP] Added Quick Fix to existing incidents_list message for incident:', thalaResponse.incidentId)
                return // Don't create a new message
              }
            }
            
            const botMessage = {
              id: thalaResponse.id,
              userId: 'thala',
              userName: 'Thala Bot',
              text: thalaResponse.content || thalaResponse.title,
              timestamp: thalaResponse.timestamp,
              isBot: true
            }
            
            // Add structured data for incidents
            if (thalaResponse.type === 'incidents_list' && thalaResponse.incidents) {
              botMessage.incidents = thalaResponse.incidents
            }
            
            // Add search results
            if (thalaResponse.type === 'search' && thalaResponse.searchResults) {
              botMessage.searchResults = thalaResponse.searchResults
            }
            
            // Handle resolution messages
            if (thalaResponse.type === 'resolution' && thalaResponse.incident) {
              botMessage.isResolution = true
              botMessage.resolutionIncidentId = thalaResponse.incident.id
            }
            
            // Add Quick Fix data (for standalone Quick Fix responses without incidentId)
            if (thalaResponse.type === 'quick_fix') {
              botMessage.quickFix = {
                title: thalaResponse.title,
                content: thalaResponse.content,
                suggestions: thalaResponse.suggestions
              }
              if (thalaResponse.incidentId) {
                botMessage.quickFix.incidentId = thalaResponse.incidentId
              }
            }
            
            // Handle info type messages (welcome, thank you, etc.)
            if (thalaResponse.type === 'info') {
              botMessage.isInfo = true
            }
            
            allSlackMessages.push(botMessage)
          })
        }
      }
    }
    
    console.log('[STEP] Total messages collected:', allSlackMessages.length)
    console.log('[STEP] Message IDs:', allSlackMessages.map(m => m.id))
    setJiraTickets(allJiraTickets)
    
    // Find new messages (not yet displayed or queued)
    setMessageQueue(prev => {
      const queuedIds = new Set(prev.map(m => m.id))
      const displayedIds = Array.from(displayedMessageIdsRef.current)
      console.log('[STEP] Already queued IDs:', Array.from(queuedIds))
      console.log('[STEP] Already displayed IDs:', displayedIds)
      
      const newMessages = allSlackMessages.filter(msg => 
        !displayedMessageIdsRef.current.has(msg.id) && !queuedIds.has(msg.id)
      )
      
      console.log('[STEP] New messages to add:', newMessages.length, newMessages.map(m => m.id))
      
      // Add new messages to queue
      if (newMessages.length > 0) {
        const updatedQueue = [...prev, ...newMessages]
        console.log('[STEP] Updated queue length:', updatedQueue.length)
        // Update ref immediately
        messageQueueRef.current = updatedQueue
        return updatedQueue
      }
      console.log('[STEP] No new messages to add')
      return prev
    })

    const stepData = demoScript[currentStep]
    if (stepData?.viewTransition) {
      setCurrentView(stepData.viewTransition.view)
      if (stepData.viewTransition.view === 'jira' && stepData.viewTransition.ticketId) {
        const ticket = allJiraTickets.find(t => t.id === stepData.viewTransition.ticketId)
        setActiveJiraTicket(ticket)
      }
    } else if (stepData?.jira && stepData.jira.length > 0) {
      setCurrentView('jira')
      setActiveJiraTicket(stepData.jira[0])
    } else if (currentStep === 0) {
      setCurrentView('slack')
    }
  }, [currentStep])

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Welcome Modal Popup */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8 relative`}
          >
            <button
              onClick={() => setShowWelcomeModal(false)}
              className={`absolute top-4 right-4 transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h2 className={`text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Welcome to the Demo Arena</h2>
              <p className={`text-lg mb-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Where you can test drive Thala on your own time.
              </p>
              <p className={`text-lg mb-6 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Pick a tour, see how the product works, and get to know Thala
              </p>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Thala Demo Simulation</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Interactive sandbox environment</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Step {currentStep + 1} of {demoScript.filter(s => s.step >= 0).length}
              </span>
              <div className={`w-48 rounded-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStep + 1) / demoScript.filter(s => s.step >= 0).length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <DemoController
        currentStep={currentStep}
        totalSteps={demoScript.filter(s => s.step >= 0).length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onReset={handleReset}
        stepDescription={currentStepData?.description}
        currentView={currentView}
        onViewChange={setCurrentView}
        stepHighlights={currentStepData?.highlights}
        canProceed={canProceedToNextStep()}
        theme={theme}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="transition-all duration-500 ease-in-out">
          {currentView === 'slack' ? (
            (() => {
              console.log('[APP] Rendering SlackSimulator with', displayedMessages.length, 'messages')
              console.log('[APP] Displayed message IDs:', displayedMessages.map(m => m.id))
              return (
                <SlackSimulator 
                  messages={displayedMessages}
                  currentStep={currentStep}
                  stepData={currentStepData}
                  onNewMessage={playMessageSound}
                  typingUsers={typingUsers}
                  onQuickFixRequest={handleQuickFixRequest}
                  resolvedIncidentIds={resolvedIncidentIds}
                  theme={theme}
                />
              )
            })()
          ) : (
            <JiraFullView
              tickets={jiraTickets}
              theme={theme}
              activeTicket={activeJiraTicket}
              currentStep={currentStep}
              stepData={currentStepData}
              onBackToSlack={() => setCurrentView('slack')}
              isCreating={currentStepData?.viewTransition?.action === 'create'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
