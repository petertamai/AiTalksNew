// app/page.tsx
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Bug, Sparkles, Zap, BrainCircuit, RotateCcw } from 'lucide-react'
import { ConversationProvider, useConversation } from '@/contexts/ConversationContext'
import { ConversationDisplay } from '@/components/ai-conversation/conversation-display'
import { ConversationFlow } from '@/components/ai-conversation/conversation-flow'
import { PremiumSettingsPanel } from '@/components/ai-conversation/premium-settings-panel'
import { AIAgent, ConversationDirection, OpenRouterResponse } from '@/types'
import { 
  generateId, 
  calculateSpeakingTime, 
  debugLog,
  loadConversationSettings,
  saveConversationSettings,
  debouncedSaveAI1Config,
  debouncedSaveAI2Config,
  debouncedSaveStartingMessage,
  resetConversationSettings,
  DEFAULT_AI1_CONFIG,
  DEFAULT_AI2_CONFIG,
  DEFAULT_STARTING_MESSAGE,
  DEFAULT_CONVERSATION_DIRECTION
} from '@/lib/utils'
import { toast } from 'sonner'

function MainApp() {
  const { 
    state, 
    addMessage, 
    startConversation, 
    stopConversation, 
    setTypingIndicator, 
    setSpeakingState, 
    clearMessages,
    resetConversationState
  } = useConversation()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [ai1Config, setAI1Config] = useState<AIAgent>(DEFAULT_AI1_CONFIG)
  const [ai2Config, setAI2Config] = useState<AIAgent>(DEFAULT_AI2_CONFIG)
  const [startingMessage, setStartingMessage] = useState<string>(DEFAULT_STARTING_MESSAGE)
  const [conversationDirection, setConversationDirection] = useState<ConversationDirection>(DEFAULT_CONVERSATION_DIRECTION)
  const [conversationId, setConversationId] = useState('')
  const [hasAudio, setHasAudio] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false)
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false)
  
  // Use useRef to track conversation state to avoid closure issues
  const isConversationActiveRef = useRef(false)
  const currentMessagesRef = useRef<typeof state.messages>([])
  
  // Initialize audio elements only on client side to avoid SSR issues
  const audioElements = useRef<{ [key: string]: HTMLAudioElement }>({})

  // Audio cleanup function
  const cleanupAudio = useCallback((aiId: string) => {
    const audio = audioElements.current[aiId]
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src)
      }
      audio.src = ''
      audio.onended = null
      audio.onerror = null
    }
  }, [])

  // Load settings from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClientSide(true)
      setConversationId(generateId())
      
      // Initialize audio elements
      audioElements.current = {
        ai1: new Audio(),
        ai2: new Audio(),
      }
      console.log('🔊 Audio elements initialized on client side')

      // Load conversation settings from localStorage
      try {
        console.log('🔄 Loading settings from localStorage...')
        const savedSettings = loadConversationSettings()
        
        setAI1Config(savedSettings.ai1Config)
        setAI2Config(savedSettings.ai2Config)
        setStartingMessage(savedSettings.startingMessage)
        setConversationDirection(savedSettings.conversationDirection)
        setHasLoadedSettings(true)
        
        console.log('✅ Settings loaded successfully:', {
          ai1: savedSettings.ai1Config.name,
          ai2: savedSettings.ai2Config.name,
          startingMessage: savedSettings.startingMessage.substring(0, 30) + '...',
          direction: savedSettings.conversationDirection
        })
        
        toast.success('Settings Loaded', {
          description: 'Your conversation settings have been restored.',
          duration: 2000
        })
      } catch (error) {
        console.error('❌ Error loading settings:', error)
        setHasLoadedSettings(true)
        toast.error('Settings Load Failed', {
          description: 'Using default settings. Your preferences may not be saved.',
          duration: 3000
        })
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        Object.keys(audioElements.current).forEach(aiId => {
          cleanupAudio(aiId)
        })
        console.log('🧹 Audio elements cleaned up on unmount')
      }
    }
  }, [cleanupAudio])

  // Save settings to localStorage when they change (with debouncing)
  useEffect(() => {
    if (hasLoadedSettings && isClientSide) {
      console.log('💾 AI1 config changed, saving...', ai1Config.name)
      debouncedSaveAI1Config(ai1Config)
    }
  }, [ai1Config, hasLoadedSettings, isClientSide])

  useEffect(() => {
    if (hasLoadedSettings && isClientSide) {
      console.log('💾 AI2 config changed, saving...', ai2Config.name)
      debouncedSaveAI2Config(ai2Config)
    }
  }, [ai2Config, hasLoadedSettings, isClientSide])

  useEffect(() => {
    if (hasLoadedSettings && isClientSide) {
      console.log('💾 Starting message changed, saving...', startingMessage.substring(0, 30) + '...')
      debouncedSaveStartingMessage(startingMessage)
    }
  }, [startingMessage, hasLoadedSettings, isClientSide])

  useEffect(() => {
    if (hasLoadedSettings && isClientSide) {
      console.log('💾 Conversation direction changed, saving...', conversationDirection)
      saveConversationSettings({ conversationDirection })
    }
  }, [conversationDirection, hasLoadedSettings, isClientSide])

  // Sync refs with actual state
  useEffect(() => {
    isConversationActiveRef.current = state.isActive
    currentMessagesRef.current = state.messages
    log(`🔄 State sync: isActive = ${state.isActive}, messageCount = ${state.messages.length}`)
  }, [state.isActive, state.messages])

  const log = useCallback((message: string, data?: any) => {
    debugLog(message, data)
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry, data || '')
    setDebugLogs(prev => [...prev.slice(-19), logEntry])
  }, [])

  // Get current conversation history for AI context
  const getCurrentConversationHistory = useCallback(() => {
    const messages = currentMessagesRef.current
    return messages
      .filter(msg => msg.role !== 'system') // Exclude system messages from AI context
      .map(msg => ({
        role: msg.role === 'human' ? 'user' : 'assistant',
        content: msg.content,
        // Include agent information in content for better context
        ...(msg.agent && msg.role === 'assistant' ? {
          name: msg.agent === 'ai1' ? ai1Config.name : ai2Config.name
        } : {})
      }))
      .slice(-20) // Keep last 20 messages for context (adjust as needed)
  }, [ai1Config.name, ai2Config.name])

  const getAIResponse = async (
    aiId: 'ai1' | 'ai2',
    prompt: string
  ) => {
    const config = aiId === 'ai1' ? ai1Config : ai2Config
    
    log(`🤖 Getting ${aiId} (${config.name}) response using model: ${config.model}`)
    
    // Get current conversation history
    const conversationHistory = getCurrentConversationHistory()
    
    log(`📚 Conversation history for ${aiId}:`, {
      historyLength: conversationHistory.length,
      totalMessages: currentMessagesRef.current.length
    })

    const messages = [
      {
        role: 'system',
        content: `${config.prompt}\n\nYou are ${config.name}, engaging in a conversation with another AI assistant. Keep your responses natural, thoughtful, and conversational. Build upon the conversation history and respond directly to what was just said. Avoid repeating information already covered unless it adds new insight.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: prompt
      }
    ]

    log(`🔍 Full context for ${aiId}:`, {
      systemPrompt: messages[0].content.substring(0, 100) + '...',
      historyCount: conversationHistory.length,
      newPrompt: prompt.substring(0, 100) + '...'
    })

    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data: OpenRouterResponse = await response.json()
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const responseContent = data.choices[0].message.content.trim()
      log(`✅ ${aiId} response received:`, {
        length: responseContent.length,
        preview: responseContent.substring(0, 100) + '...'
      })
      return responseContent
    } else {
      throw new Error('Invalid response format from API')
    }
  }

  const addThinkingDelay = async (aiId: 'ai1' | 'ai2') => {
    log(`💭 ${aiId} is thinking...`)
    setTypingIndicator(aiId, true)
    const thinkingTime = 1500 + Math.random() * 2500
    await new Promise(resolve => setTimeout(resolve, thinkingTime))
  }

  const speakText = async (
    aiId: 'ai1' | 'ai2',
    text: string,
    messageIndex: number
  ): Promise<void> => {
    const config = aiId === 'ai1' ? ai1Config : ai2Config
    
    if (!config.tts.enabled) {
      log(`🔇 TTS disabled for ${aiId}, skipping speech generation`)
      return Promise.resolve()
    }
    
    log(`🎵 Generating TTS for ${aiId}: "${text.substring(0, 50)}..."`)
    
    try {
      setSpeakingState(aiId, true)
      setHasAudio(true)
      
      const response = await fetch('/api/groq/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          voice: config.tts.voice,
          input: text,
          conversation_id: conversationId,
          message_index: messageIndex,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown TTS error' }))
        throw new Error(errorData.error || `TTS API error: ${response.status}`)
      }
      
      // Get audio blob
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      log(`✅ TTS audio generated for ${aiId}, size: ${audioBlob.size} bytes`)
      
      // Play audio if client-side
      if (isClientSide && audioElements.current[aiId]) {
        const audio = audioElements.current[aiId]
        
        // Stop any existing audio for this AI first
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
        
        audio.src = audioUrl
        
        return new Promise((resolve) => {
          const cleanup = () => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            audio.onended = null
            audio.onerror = null
          }

          const onEnded = () => {
            cleanup()
            log(`🎯 Audio playback COMPLETED for ${aiId}`)
            resolve()
          }
          
          const onError = (error: any) => {
            cleanup()
            log(`⚠️ Audio playback error for ${aiId}:`, error)
            resolve()
          }
          
          audio.onended = onEnded
          audio.onerror = onError
          
          const estimatedDuration = calculateSpeakingTime(text)
          const timeoutId = setTimeout(() => {
            if (!audio.paused && !audio.ended) {
              log(`⏱️ Audio still playing for ${aiId} after ${estimatedDuration + 3000}ms, continuing anyway`)
              cleanup()
              resolve()
            }
          }, estimatedDuration + 3000)
          
          const originalOnEnded = onEnded
          const originalOnError = onError
          
          audio.onended = () => {
            clearTimeout(timeoutId)
            originalOnEnded()
          }
          
          audio.onerror = (error) => {
            clearTimeout(timeoutId)
            originalOnError(error)
          }
          
          audio.play().then(() => {
            log(`🔊 Audio playback started for ${aiId}`)
          }).catch((playError) => {
            clearTimeout(timeoutId)
            cleanup()
            log(`⚠️ Audio play error for ${aiId}:`, playError)
            resolve()
          })
        })
      } else {
        const speakingTime = calculateSpeakingTime(text)
        log(`⏱️ Simulating speaking time for ${aiId}: ${speakingTime}ms`)
        
        return new Promise(resolve => {
          setTimeout(() => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            log(`✅ Simulated speech completed for ${aiId}`)
            resolve()
          }, speakingTime)
        })
      }
      
    } catch (error) {
      log(`⚠️ TTS error for ${aiId}:`, error)
      setSpeakingState(aiId, false)
      
      return new Promise(resolve => {
        setTimeout(() => {
          log(`✅ TTS fallback delay completed for ${aiId}`)
          resolve()
        }, 1000)
      })
    }
  }

  const processTurn = async (
    currentAi: 'ai1' | 'ai2',
    message: string,
    isFirstMessage = false
  ): Promise<void> => {
    log(`🎬 Processing turn for ${currentAi}, first: ${isFirstMessage}, active: ${isConversationActiveRef.current}`)
    
    if (!isConversationActiveRef.current) {
      log(`❌ Conversation not active, stopping turn for ${currentAi}`)
      return
    }

    try {
      await addThinkingDelay(currentAi)
      
      if (!isConversationActiveRef.current) {
        log(`❌ Conversation stopped during thinking for ${currentAi}`)
        setTypingIndicator(currentAi, false)
        return
      }

      log(`📞 Getting AI response for ${currentAi}`)
      
      const response = await getAIResponse(currentAi, message)
      
      if (response && response.includes('#END#')) {
        log(`🔚 ${currentAi} responded with #END#. Ending conversation.`)
        setTypingIndicator(currentAi, false)
        isConversationActiveRef.current = false
        stopConversation('Conversation has ended naturally')
        return
      }

      setTypingIndicator(currentAi, false)

      if (!response || response.trim() === '') {
        throw new Error(`Empty response from ${currentAi}`)
      }

      const messageIndex = currentMessagesRef.current.length
      log(`💬 Adding message from ${currentAi}, index: ${messageIndex}`)
      
      addMessage({
        role: 'assistant',
        content: response,
        agent: currentAi,
        model: currentAi === 'ai1' ? ai1Config.model : ai2Config.model,
      })

      log(`🎵 Starting TTS for ${currentAi} and WAITING for completion...`)
      await speakText(currentAi, response, messageIndex)
      log(`✅ TTS completed for ${currentAi}, conversation can continue`)

      if (!isConversationActiveRef.current) {
        log(`❌ Conversation stopped after TTS completion for ${currentAi}`)
        return
      }

      log(`⏸️ Brief pause between speakers...`)
      await new Promise(resolve => setTimeout(resolve, 800))

      if (!isConversationActiveRef.current) {
        log(`❌ Conversation stopped during pause after ${currentAi}`)
        return
      }

      const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1'
      log(`🔄 Continuing conversation with ${otherAi} (previous speaker: ${currentAi} finished)`)
      await processTurn(otherAi, response, false)
      
    } catch (error) {
      log(`❌ Error in processTurn for ${currentAi}: ${error}`)
      setTypingIndicator(currentAi, false)
      setSpeakingState(currentAi, false)
      isConversationActiveRef.current = false
      
      addMessage({
        role: 'system',
        content: `An error occurred with ${currentAi}: ${error}. Conversation stopped.`,
      })
      stopConversation('Conversation stopped due to error')
    }
  }

  const handleStartConversation = async (direction: ConversationDirection, message: string) => {
    log('🚀 STARTING PREMIUM AI CONVERSATION', {
      direction,
      message: message.substring(0, 50) + '...',
      ai1Model: ai1Config.model,
      ai2Model: ai2Config.model,
      ai1Name: ai1Config.name,
      ai2Name: ai2Config.name,
      currentMessageCount: state.messages.length,
      isCurrentlyActive: state.isActive
    })

    if (!ai1Config.model || !ai2Config.model) {
      toast.error('Configuration Required', {
        description: 'Please select models for both AI agents in settings first.'
      })
      return
    }

    if (!message.trim()) {
      toast.error('Missing Message', {
        description: 'Please provide a starting message.'
      })
      return
    }

    if (state.isActive || isConversationActiveRef.current) {
      toast.warning('Conversation Active', {
        description: 'A conversation is already active. Stop it first.'
      })
      return
    }

    try {
      log('🧹 Resetting conversation state completely')
      
      resetConversationState()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const newConversationId = generateId()
      setConversationId(newConversationId)
      setHasAudio(false)
      
      log('🎬 Initializing new conversation', {
        newConversationId,
        messagesAfterReset: currentMessagesRef.current.length
      })
      
      isConversationActiveRef.current = true
      startConversation()

      // Update conversation direction and save it
      setConversationDirection(direction)

      let sender: 'ai1' | 'ai2'
      let receiver: 'ai1' | 'ai2'

      if (direction === 'ai1-to-ai2') {
        sender = 'ai1'
        receiver = 'ai2'
      } else {
        sender = 'ai2'
        receiver = 'ai1'
      }

      log(`📝 Adding initial message from ${sender} to ${receiver}`)

      const initialMessageIndex = 0
      addMessage({
        role: 'assistant',
        content: message,
        agent: sender,
        model: sender === 'ai1' ? ai1Config.model : ai2Config.model,
      })

      log(`🎵 Generating TTS for initial message from ${sender}`)
      await speakText(sender, message, initialMessageIndex)

      toast.success('AI Conversation Started', {
        description: `Premium AI conversation initiated: ${sender} → ${receiver}`,
        duration: 3000
      })

      log(`🎯 Starting conversation flow with ${receiver}`)
      await processTurn(receiver, message, true)
      
    } catch (error) {
      log(`❌ Error starting conversation: ${error}`)
      isConversationActiveRef.current = false
      addMessage({
        role: 'system',
        content: `Failed to start conversation: ${error}`,
      })
      stopConversation('Conversation failed to start')
      toast.error('Conversation Failed', {
        description: `Failed to start conversation: ${error}`
      })
    }
  }

  const handleStopConversation = useCallback(() => {
    log('🛑 Stopping conversation manually')
    isConversationActiveRef.current = false
    
    Object.keys(audioElements.current).forEach(aiId => {
      cleanupAudio(aiId)
      log(`🔇 Audio stopped and cleaned for ${aiId}`)
    })
    
    setSpeakingState('ai1', false)
    setSpeakingState('ai2', false)
    setTypingIndicator('ai1', false)
    setTypingIndicator('ai2', false)
    
    stopConversation('Conversation stopped by user')
    
    log('✅ Conversation stopped and all audio cleared')
  }, [stopConversation, setSpeakingState, setTypingIndicator, cleanupAudio])

  const handleResetSettings = () => {
    try {
      resetConversationSettings()
      
      // Reset state to defaults
      setAI1Config(DEFAULT_AI1_CONFIG)
      setAI2Config(DEFAULT_AI2_CONFIG)
      setStartingMessage(DEFAULT_STARTING_MESSAGE)
      setConversationDirection(DEFAULT_CONVERSATION_DIRECTION)
      
      toast.success('Settings Reset', {
        description: 'All conversation settings have been reset to defaults.',
        duration: 3000
      })
    } catch (error) {
      toast.error('Reset Failed', {
        description: 'Failed to reset settings to defaults.'
      })
    }
  }

  const handleShareConversation = async () => {
    if (state.messages.length === 0) {
      toast.error('Nothing to Share', {
        description: 'No conversation to share. Start a conversation first.'
      })
      return
    }

    const loadingToast = toast.loading('Creating shareable link...')

    try {
      const conversationData = {
        id: conversationId,
        settings: {
          messageDirection: conversationDirection,
          models: {
            ai1: ai1Config.model,
            ai2: ai2Config.model,
          },
          names: {
            ai1: ai1Config.name,
            ai2: ai2Config.name,
          },
          prompts: {
            ai1: ai1Config.prompt,
            ai2: ai2Config.prompt,
          },
          tts: {
            ai1: ai1Config.tts,
            ai2: ai2Config.tts,
          },
          parameters: {
            ai1: {
              maxTokens: ai1Config.maxTokens,
              temperature: ai1Config.temperature,
            },
            ai2: {
              maxTokens: ai2Config.maxTokens,
              temperature: ai2Config.temperature,
            },
          },
        },
        messages: state.messages,
        created_at: new Date().toISOString(),
      }

      const response = await fetch('/api/conversations/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          data: conversationData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const shareUrl = data.shareUrl
        
        toast.dismiss(loadingToast)
        
        toast.success('Conversation Shared Successfully! 🎉', {
          description: 'Link expires in 30 days',
          action: {
            label: 'Copy Link',
            onClick: () => {
              navigator.clipboard.writeText(shareUrl).then(() => {
                toast.success('Link copied to clipboard!')
              }).catch(() => {
                toast.error('Failed to copy link')
              })
            }
          },
          duration: 10000,
        })

        setTimeout(() => {
          toast.info('Share Link Ready', {
            description: shareUrl,
            action: {
              label: 'Open',
              onClick: () => window.open(shareUrl, '_blank')
            },
            duration: 15000,
          })
        }, 1000)
        
      } else {
        toast.dismiss(loadingToast)
        toast.error('Share Failed', {
          description: data.error || 'Unknown error occurred while sharing.'
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Share Error', {
        description: 'An unexpected error occurred while sharing the conversation.'
      })
    }
  }

  const handlePlayAudio = async () => {
    try {
      const response = await fetch(`/api/conversations/audio?conversation_id=${conversationId}`)
      const data = await response.json()
      
      if (data.success && data.audioFiles && data.audioFiles.length > 0) {
        toast.success('Audio Playback', {
          description: `Found ${data.audioFiles.length} audio files`,
          duration: 2000
        })
        
        const audioUrl = `/conversations/${conversationId}/audio/${data.audioFiles[0]}`
        
        if (isClientSide && typeof window !== 'undefined') {
          const audio = new Audio(audioUrl)
          audio.play().catch(console.error)
        }
      } else {
        toast.warning('No Audio Available', {
          description: 'No audio files available for this conversation.'
        })
      }
    } catch (error) {
      toast.error('Audio Error', {
        description: 'Error loading audio files.'
      })
    }
  }

  // Show loading state until settings are loaded
  if (!isClientSide || !hasLoadedSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-lg font-medium">
            {!isClientSide ? 'Initializing AI Conversation System...' : 'Loading your settings...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                AI Conversation System
              </h1>
              <p className="text-sm text-muted-foreground">Premium AI Collaboration Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configuration
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSettings}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug
            </Button>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-black/95 text-green-400 p-4 text-xs font-mono max-h-48 overflow-y-auto border-b flex-shrink-0">
          <div className="flex items-center gap-2 mb-2 text-green-300">
            <Zap className="h-3 w-3" />
            <span>Debug Console</span>
          </div>
          {debugLogs.map((log, index) => (
            <div key={index} className="opacity-80 hover:opacity-100 transition-opacity">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <main className="container mx-auto p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Panel - Conversation Flow */}
          <div className="flex flex-col space-y-6">
            <ConversationFlow 
              ai1Config={ai1Config}
              ai2Config={ai2Config}
              isActive={state.isActive}
              onStart={handleStartConversation}
              onStop={handleStopConversation}
              disabled={false}
              className="flex-shrink-0"
              startingMessage={startingMessage}
              onStartingMessageChange={setStartingMessage}
              conversationDirection={conversationDirection}
              onDirectionChange={setConversationDirection}
            />
            
            {/* Quick Stats */}
            {state.messages.length > 0 && (
              <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{state.messages.filter(m => m.agent === 'ai1').length}</div>
                  <div className="text-xs text-blue-600/70">{ai1Config.name} Messages</div>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/50 p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{state.messages.filter(m => m.agent === 'ai2').length}</div>
                  <div className="text-xs text-purple-600/70">{ai2Config.name} Messages</div>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200/50 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{state.messages.length}</div>
                  <div className="text-xs text-green-600/70">Total Messages</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Conversation Display */}
          <div className="flex flex-col min-h-0">
            <ConversationDisplay
              state={state}
              onShare={handleShareConversation}
              onPlayAudio={handlePlayAudio}
              hasAudio={hasAudio}
              isSharedView={false}
              className="flex-1"
            />
          </div>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="border-t bg-gradient-to-r from-background to-muted/30 py-4 flex-shrink-0 mt-auto">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Powered by Advanced AI Technology</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Piotr Tamulewicz | 
            <a href="https://petertam.pro/" className="underline ml-1 hover:text-primary transition-colors">
              petertam.pro
            </a>
          </p>
        </div>
      </footer>

      {/* Premium Settings Panel */}
      <PremiumSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ai1Config={ai1Config}
        ai2Config={ai2Config}
        onAI1ConfigChange={(config) => setAI1Config(prev => ({ ...prev, ...config }))}
        onAI2ConfigChange={(config) => setAI2Config(prev => ({ ...prev, ...config }))}
        isSharedView={false}
      />
    </div>
  )
}

export default function Page() {
  return (
    <ConversationProvider>
      <MainApp />
    </ConversationProvider>
  )
}