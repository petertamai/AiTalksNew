// contexts/ConversationContext.tsx - FIXED: Enhanced message handling and state management
'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { ConversationMessage, ConversationState, ConversationDirection } from '@/types'
import { generateId, debugLog } from '@/lib/utils'

interface ConversationContextType {
  state: ConversationState
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void
  startConversation: () => void
  stopConversation: (reason?: string) => void
  setTypingIndicator: (ai: 'ai1' | 'ai2', isTyping: boolean) => void
  setSpeakingState: (ai: 'ai1' | 'ai2', isSpeaking: boolean) => void
  clearMessages: () => void
  updateLastActivity: () => void
  setError: (error: string | undefined) => void
  resetConversationState: () => void
  // NEW: Helper functions for conversation flow
  getConversationStats: () => {
    totalMessages: number
    ai1Messages: number
    ai2Messages: number
    lastSpeaker: 'ai1' | 'ai2' | null
    conversationLength: number
  }
}

type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: ConversationMessage }
  | { type: 'START_CONVERSATION' }
  | { type: 'STOP_CONVERSATION'; payload?: string }
  | { type: 'SET_TYPING'; payload: { ai: 'ai1' | 'ai2'; isTyping: boolean } }
  | { type: 'SET_SPEAKING'; payload: { ai: 'ai1' | 'ai2'; isSpeaking: boolean } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'RESET_STATE' }

const initialState: ConversationState = {
  isActive: false,
  currentAI: null,
  messages: [],
  typingIndicator: {
    ai1: false,
    ai2: false,
  },
  speakingState: {
    ai1: false,
    ai2: false,
  },
  error: undefined,
  lastActivity: undefined,
}

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  debugLog(`🔄 ConversationReducer: ${action.type}`, { 
    currentActive: state.isActive, 
    messageCount: state.messages.length 
  })
  
  switch (action.type) {
    case 'ADD_MESSAGE':
      // FIXED: Ensure messages are added in proper sequence with validation
      const newMessage = action.payload
      
      // Validate message structure
      if (!newMessage.content || !newMessage.role) {
        debugLog('❌ Invalid message structure, skipping:', newMessage)
        return state
      }

      // For assistant messages, ensure agent is specified and valid
      if (newMessage.role === 'assistant') {
        if (!newMessage.agent || (newMessage.agent !== 'ai1' && newMessage.agent !== 'ai2')) {
          debugLog('⚠️ Assistant message missing or invalid agent, defaulting to ai1:', newMessage)
          newMessage.agent = 'ai1'
        }
      }

      debugLog(`📝 Adding message [${state.messages.length}]:`, {
        role: newMessage.role,
        agent: newMessage.agent,
        contentLength: newMessage.content.length,
        preview: newMessage.content.substring(0, 50) + '...'
      })

      return {
        ...state,
        messages: [...state.messages, newMessage],
        lastActivity: newMessage.timestamp,
        currentAI: newMessage.role === 'assistant' ? (newMessage.agent || null) : state.currentAI,
      }
      
    case 'START_CONVERSATION':
      debugLog('🎬 ConversationReducer: Starting conversation')
      return {
        ...state,
        isActive: true,
        currentAI: null,
        error: undefined,
        // Reset all indicators when starting
        typingIndicator: { ai1: false, ai2: false },
        speakingState: { ai1: false, ai2: false },
        lastActivity: new Date().toISOString(),
      }
      
    case 'STOP_CONVERSATION':
      debugLog('🛑 ConversationReducer: Stopping conversation', { reason: action.payload })
      return {
        ...state,
        isActive: false,
        currentAI: null,
        // Clear all indicators when stopping
        typingIndicator: { ai1: false, ai2: false },
        speakingState: { ai1: false, ai2: false },
        lastActivity: new Date().toISOString(),
      }
      
    case 'SET_TYPING':
      return {
        ...state,
        typingIndicator: {
          ...state.typingIndicator,
          [action.payload.ai]: action.payload.isTyping,
        },
        currentAI: action.payload.isTyping ? action.payload.ai : state.currentAI,
        lastActivity: new Date().toISOString(),
      }
      
    case 'SET_SPEAKING':
      return {
        ...state,
        speakingState: {
          ...state.speakingState,
          [action.payload.ai]: action.payload.isSpeaking,
        },
        currentAI: action.payload.isSpeaking ? action.payload.ai : state.currentAI,
        lastActivity: new Date().toISOString(),
      }
      
    case 'CLEAR_MESSAGES':
      debugLog('🗑️ ConversationReducer: Clearing messages')
      return {
        ...state,
        messages: [],
        error: undefined,
        currentAI: null,
        // Also clear all indicators when clearing messages
        typingIndicator: { ai1: false, ai2: false },
        speakingState: { ai1: false, ai2: false },
        lastActivity: new Date().toISOString(),
      }
      
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date().toISOString(),
      }
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        lastActivity: new Date().toISOString(),
      }

    case 'RESET_STATE':
      debugLog('🔄 ConversationReducer: Resetting entire state')
      return {
        ...initialState,
        lastActivity: new Date().toISOString(),
      }
      
    default:
      return state
  }
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

interface ConversationProviderProps {
  children: React.ReactNode
  enablePersistence?: boolean
  maxMessages?: number
}

export function ConversationProvider({ 
  children, 
  enablePersistence = false,
  maxMessages = 1000 
}: ConversationProviderProps) {
  const [state, dispatch] = useReducer(conversationReducer, initialState)

  // Load persisted state on mount
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const persistedState = localStorage.getItem('conversation-state')
        if (persistedState) {
          const parsed = JSON.parse(persistedState)
          // Only restore messages, not active state
          if (parsed.messages && Array.isArray(parsed.messages)) {
            parsed.messages.forEach((message: ConversationMessage) => {
              dispatch({ type: 'ADD_MESSAGE', payload: message })
            })
          }
        }
      } catch (error) {
        debugLog('❌ Failed to load persisted conversation state:', error)
      }
    }
  }, [enablePersistence])

  // Persist state changes
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const stateToSave = {
          messages: state.messages.slice(-50), // Only save last 50 messages
          lastActivity: state.lastActivity,
        }
        localStorage.setItem('conversation-state', JSON.stringify(stateToSave))
      } catch (error) {
        debugLog('❌ Failed to persist conversation state:', error)
      }
    }
  }, [state.messages, state.lastActivity, enablePersistence])

  // Auto-cleanup old messages
  useEffect(() => {
    if (state.messages.length > maxMessages) {
      const messagesToKeep = state.messages.slice(-maxMessages)
      // First clear, then add the messages to keep
      dispatch({ type: 'CLEAR_MESSAGES' })
      messagesToKeep.forEach(message => {
        dispatch({ type: 'ADD_MESSAGE', payload: message })
      })
    }
  }, [state.messages.length, maxMessages])

  const addMessage = useCallback((message: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    const fullMessage: ConversationMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }
    
    debugLog('💬 Adding message via context:', {
      role: fullMessage.role,
      agent: fullMessage.agent,
      contentPreview: fullMessage.content.substring(0, 50) + '...',
      messageId: fullMessage.id,
      sequenceNumber: state.messages.length
    })
    
    dispatch({ type: 'ADD_MESSAGE', payload: fullMessage })
  }, [state.messages.length])

  const startConversation = useCallback(() => {
    debugLog('🎬 startConversation called via context')
    dispatch({ type: 'START_CONVERSATION' })
  }, [])

  const stopConversation = useCallback((reason?: string) => {
    debugLog('🛑 stopConversation called via context:', reason)
    
    // First stop the conversation
    dispatch({ type: 'STOP_CONVERSATION', payload: reason })
    
    // Add system message about stopping if reason provided
    if (reason) {
      const stopMessage: ConversationMessage = {
        id: generateId(),
        role: 'system',
        content: reason,
        timestamp: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_MESSAGE', payload: stopMessage })
    }
  }, [])

  const setTypingIndicator = useCallback((ai: 'ai1' | 'ai2', isTyping: boolean) => {
    debugLog(`💭 setTypingIndicator via context: ${ai} = ${isTyping}`)
    dispatch({ type: 'SET_TYPING', payload: { ai, isTyping } })
  }, [])

  const setSpeakingState = useCallback((ai: 'ai1' | 'ai2', isSpeaking: boolean) => {
    debugLog(`🎵 setSpeakingState via context: ${ai} = ${isSpeaking}`)
    dispatch({ type: 'SET_SPEAKING', payload: { ai, isSpeaking } })
  }, [])

  const clearMessages = useCallback(() => {
    debugLog('🗑️ clearMessages called via context')
    dispatch({ type: 'CLEAR_MESSAGES' })
  }, [])

  const updateLastActivity = useCallback(() => {
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }, [])

  const setError = useCallback((error: string | undefined) => {
    debugLog('❌ setError called via context:', error)
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const resetConversationState = useCallback(() => {
    debugLog('🔄 resetConversationState called via context - full state reset')
    dispatch({ type: 'RESET_STATE' })
  }, [])

  // NEW: Helper function for conversation statistics
  const getConversationStats = useCallback(() => {
    const messages = state.messages.filter(m => m.role === 'assistant')
    const ai1Messages = messages.filter(m => m.agent === 'ai1')
    const ai2Messages = messages.filter(m => m.agent === 'ai2')
    const lastMessage = messages[messages.length - 1]
    
    const stats = {
      totalMessages: messages.length,
      ai1Messages: ai1Messages.length,
      ai2Messages: ai2Messages.length,
      lastSpeaker: (lastMessage?.agent as 'ai1' | 'ai2') || null,
      conversationLength: messages.length
    }
    
    debugLog('📊 Conversation stats calculated:', stats)
    return stats
  }, [state.messages])

  // Auto-clear error after 10 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setError(undefined)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [state.error, setError])

  // Debug logging for state changes
  useEffect(() => {
    debugLog('🔍 Conversation state updated via context:', {
      isActive: state.isActive,
      messageCount: state.messages.length,
      typing: state.typingIndicator,
      speaking: state.speakingState,
      currentAI: state.currentAI,
      error: state.error,
      lastActivity: state.lastActivity
    })
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any active conversation on unmount
      if (state.isActive) {
        debugLog('🧹 Cleaning up active conversation on context unmount')
        dispatch({ type: 'STOP_CONVERSATION', payload: 'Component unmounted' })
      }
    }
  }, [state.isActive])

  const contextValue: ConversationContextType = {
    state,
    addMessage,
    startConversation,
    stopConversation,
    setTypingIndicator,
    setSpeakingState,
    clearMessages,
    updateLastActivity,
    setError,
    resetConversationState,
    getConversationStats,
  }

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

// Custom hooks for specific functionality
export function useConversationStatus() {
  const { state } = useConversation()
  
  return {
    isActive: state.isActive,
    hasMessages: state.messages.length > 0,
    isAnyAITyping: state.typingIndicator.ai1 || state.typingIndicator.ai2,
    isAnyAISpeaking: state.speakingState.ai1 || state.speakingState.ai2,
    hasError: Boolean(state.error),
    error: state.error,
    lastActivity: state.lastActivity,
    currentAI: state.currentAI,
  }
}

export function useConversationStats() {
  const { state } = useConversation()
  
  const stats = React.useMemo(() => {
    const messages = state.messages
    const totalMessages = messages.length
    const ai1Messages = messages.filter(m => m.agent === 'ai1').length
    const ai2Messages = messages.filter(m => m.agent === 'ai2').length
    const humanMessages = messages.filter(m => m.role === 'human').length
    const systemMessages = messages.filter(m => m.role === 'system').length
    
    const averageMessageLength = totalMessages > 0 
      ? Math.round(messages.reduce((sum, m) => sum + m.content.length, 0) / totalMessages)
      : 0
    
    const conversationDuration = messages.length > 1 
      ? new Date(messages[messages.length - 1].timestamp).getTime() - 
        new Date(messages[0].timestamp).getTime()
      : 0
    
    return {
      totalMessages,
      ai1Messages,
      ai2Messages,
      humanMessages,
      systemMessages,
      averageMessageLength,
      conversationDuration,
      isEmpty: totalMessages === 0,
    }
  }, [state.messages])
  
  return stats
}

export function useConversationMessages() {
  const { state, addMessage, clearMessages } = useConversation()
  
  const messages = state.messages
  const lastMessage = messages[messages.length - 1]
  const firstMessage = messages[0]
  
  const getMessagesByAgent = useCallback((agent: 'ai1' | 'ai2') => {
    return messages.filter(m => m.agent === agent)
  }, [messages])
  
  const getMessagesByRole = useCallback((role: ConversationMessage['role']) => {
    return messages.filter(m => m.role === role)
  }, [messages])
  
  const searchMessages = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return messages.filter(m => 
      m.content.toLowerCase().includes(lowerQuery)
    )
  }, [messages])
  
  // NEW: Get conversation flow for AI context building
  const getConversationFlow = useCallback((forAI: 'ai1' | 'ai2') => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    
    return assistantMessages.map((message, index) => ({
      ...message,
      isFromSelf: message.agent === forAI,
      turnNumber: index + 1,
      isLatest: index === assistantMessages.length - 1
    }))
  }, [messages])
  
  return {
    messages,
    lastMessage,
    firstMessage,
    addMessage,
    clearMessages,
    getMessagesByAgent,
    getMessagesByRole,
    searchMessages,
    getConversationFlow,
  }
}

// Export default for convenience
export default ConversationProvider