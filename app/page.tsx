// app/page.tsx - COMPLETE FIXED VERSION: NO NAMES, NO DUPLICATES
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Bug, Sparkles, Zap, BrainCircuit, RotateCcw, Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react'
import { ConversationProvider, useConversation } from '@/contexts/ConversationContext'
import { ConversationDisplay } from '@/components/ai-conversation/conversation-display'
import { ConversationFlow } from '@/components/ai-conversation/conversation-flow'
import { PremiumSettingsPanel } from '@/components/ai-conversation/premium-settings-panel'
import { AIAgent, ConversationDirection, OpenRouterResponse } from '@/types'
import Link from "next/link";
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

// Audio Player Types
interface AudioPlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentIndex: number
  currentMessageIndex: number
  totalFiles: number
  currentAgent: 'ai1' | 'ai2' | null
  progress: number
  currentTime: number
  duration: number
}

// ROBUST Audio Player Class with Enhanced Error Handling
class ConversationAudioPlayer {
  private audioFiles: Array<{filename: string, messageIndex: number, agent: 'ai1' | 'ai2', url: string}> = []
  private currentAudio: HTMLAudioElement | null = null
  private currentIndex = 0
  private isPlaying = false
  private isPaused = false
  private onStateChange: (state: AudioPlayerState) => void
  private onMessageHighlight: (messageIndex: number, agent: 'ai1' | 'ai2' | null) => void
  private errorCount = 0
  private maxErrors = 5
  private skipAfterError = false

  constructor(
    onStateChange: (state: AudioPlayerState) => void,
    onMessageHighlight: (messageIndex: number, agent: 'ai1' | 'ai2' | null) => void
  ) {
    this.onStateChange = onStateChange
    this.onMessageHighlight = onMessageHighlight
  }

  async loadConversation(conversationId: string, messages: any[]): Promise<boolean> {
    try {
      console.log('🎵 Loading audio files for conversation:', conversationId)
      
      const response = await fetch(`/api/conversations/audio?conversation_id=${conversationId}`)
      const data = await response.json()
      
      if (!data.success || !data.audioFiles || data.audioFiles.length === 0) {
        console.log('❌ No audio files found for conversation')
        return false
      }

      this.audioFiles = data.audioFiles.map((filename: string) => {
        const indexMatch = filename.match(/message_(\d+)\.mp3/)
        const messageIndex = indexMatch ? parseInt(indexMatch[1]) : 0
        
        const message = messages[messageIndex]
        const agent = message?.agent || 'ai1'
        
        return {
          filename,
          messageIndex,
          agent,
          url: `/conversations/${conversationId}/audio/${filename}`
        }
      }).sort((a: any, b: any) => a.messageIndex - b.messageIndex)

      console.log('✅ Loaded audio files:', this.audioFiles.length, this.audioFiles)
      
      this.errorCount = 0
      this.skipAfterError = false
      this.updateState()
      return true
    } catch (error) {
      console.error('❌ Failed to load conversation audio:', error)
      return false
    }
  }

  private updateState() {
    const currentFile = this.audioFiles[this.currentIndex]
    const state: AudioPlayerState = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      currentMessageIndex: currentFile?.messageIndex ?? -1,
      totalFiles: this.audioFiles.length,
      currentAgent: currentFile?.agent ?? null,
      progress: 0,
      currentTime: 0,
      duration: 0
    }

    if (this.currentAudio && this.currentAudio.duration) {
      state.progress = this.currentAudio.duration > 0 
        ? (this.currentAudio.currentTime / this.currentAudio.duration) * 100 
        : 0
      state.currentTime = this.currentAudio.currentTime
      state.duration = this.currentAudio.duration || 0
    }

    this.onStateChange(state)
  }

  async play(): Promise<void> {
    if (this.audioFiles.length === 0) {
      console.log('❌ No audio files to play')
      toast.error('No Audio Files', {
        description: 'No audio files available to play.'
      })
      return
    }

    if (this.isPaused && this.currentAudio) {
      try {
        await this.currentAudio.play()
        this.isPaused = false
        this.isPlaying = true
        this.updateState()
        console.log('▶️ Resumed audio playback')
        toast.success('Audio Resumed')
      } catch (error) {
        console.error('❌ Failed to resume audio:', error)
        toast.error('Resume Failed', {
          description: 'Failed to resume audio playback.'
        })
      }
      return
    }

    this.errorCount = 0
    this.skipAfterError = false
    this.isPlaying = true
    this.isPaused = false
    
    await this.playCurrentFile()
  }

  private async playCurrentFile(): Promise<void> {
    if (this.errorCount >= this.maxErrors) {
      console.error('❌ Too many errors, stopping playback')
      toast.error('Audio Playback Failed', {
        description: 'Too many audio errors encountered. Playback stopped.'
      })
      this.stop()
      return
    }

    if (this.currentIndex >= this.audioFiles.length) {
      console.log('✅ Conversation playback completed')
      toast.success('Playback Complete', {
        description: 'Finished playing all audio messages.'
      })
      this.stop()
      return
    }

    const currentFile = this.audioFiles[this.currentIndex]
    console.log(`🎵 Playing file ${this.currentIndex + 1}/${this.audioFiles.length}:`, currentFile.filename)

    this.onMessageHighlight(currentFile.messageIndex, currentFile.agent)

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.src = ''
      this.currentAudio.onended = null
      this.currentAudio.onerror = null
      this.currentAudio.ontimeupdate = null
      this.currentAudio.onloadedmetadata = null
    }

    this.currentAudio = new Audio()
    
    this.currentAudio.onerror = (event) => {
      this.errorCount++
      console.error(`❌ Audio error for ${currentFile.filename} (Error #${this.errorCount}):`, event)
      
      this.onMessageHighlight(-1, null)
      this.currentIndex++
      
      if (this.isPlaying && this.currentIndex < this.audioFiles.length && this.errorCount < this.maxErrors) {
        console.log(`⏭️ Skipping to next file due to error...`)
        setTimeout(() => {
          if (this.isPlaying) {
            this.playCurrentFile()
          }
        }, 500)
      } else {
        console.error('❌ Stopping playback due to errors or end of files')
        this.stop()
      }
    }

    this.currentAudio.onended = () => {
      console.log(`✅ Completed playing: ${currentFile.filename}`)
      
      this.onMessageHighlight(-1, null)
      this.currentIndex++
      
      if (this.isPlaying && this.currentIndex < this.audioFiles.length) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.playCurrentFile()
          }
        }, 800)
      } else {
        console.log('🎉 Conversation playback completed!')
        this.stop()
      }
    }
    
    this.currentAudio.ontimeupdate = () => this.updateState()
    this.currentAudio.onloadedmetadata = () => this.updateState()

    this.currentAudio.oncanplaythrough = () => {
      console.log(`✅ Audio file ready: ${currentFile.filename}`)
    }

    this.currentAudio.src = currentFile.url
    this.currentAudio.load()

    try {
      const playPromise = this.currentAudio.play()
      
      const playTimeout = setTimeout(() => {
        if (this.currentAudio && this.currentAudio.paused) {
          console.error(`⏱️ Audio play timeout for ${currentFile.filename}`)
          this.currentAudio.dispatchEvent(new Event('error'))
        }
      }, 10000)
      
      await playPromise
      clearTimeout(playTimeout)
      
      this.updateState()
      console.log(`▶️ Started playing: ${currentFile.filename}`)
      
    } catch (error) {
      console.error(`❌ Failed to play ${currentFile.filename}:`, error)
      
      this.errorCount++
      this.currentIndex++
      
      if (this.isPlaying && this.currentIndex < this.audioFiles.length && this.errorCount < this.maxErrors) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.playCurrentFile()
          }
        }, 500)
      } else {
        this.stop()
      }
    }
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause()
      this.isPaused = true
      this.isPlaying = false
      this.updateState()
      console.log('⏸️ Audio playback paused')
      toast.info('Audio Paused')
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.src = ''
      this.currentAudio.onended = null
      this.currentAudio.onerror = null
      this.currentAudio.ontimeupdate = null
      this.currentAudio.onloadedmetadata = null
    }
    
    this.isPlaying = false
    this.isPaused = false
    this.currentIndex = 0
    this.errorCount = 0
    
    this.onMessageHighlight(-1, null)
    this.updateState()
    console.log('⏹️ Audio playback stopped')
  }

  next(): void {
    if (this.currentIndex < this.audioFiles.length - 1) {
      this.currentIndex++
      if (this.isPlaying) {
        this.playCurrentFile()
      } else {
        this.updateState()
      }
    }
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--
      if (this.isPlaying) {
        this.playCurrentFile()
      } else {
        this.updateState()
      }
    }
  }

  destroy(): void {
    this.stop()
    this.audioFiles = []
    this.currentAudio = null
    this.errorCount = 0
  }
}

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
  
  // Audio Player State
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    currentMessageIndex: -1,
    totalFiles: 0,
    currentAgent: null,
    progress: 0,
    currentTime: 0,
    duration: 0
  })
  const [playbackHighlightedMessage, setPlaybackHighlightedMessage] = useState<{messageIndex: number, agent: 'ai1' | 'ai2' | null}>({messageIndex: -1, agent: null})
  
  const activeConversationIdRef = useRef<string>('')
  const isConversationActiveRef = useRef(false)
  const currentMessagesRef = useRef<typeof state.messages>([])
  const audioPlayerRef = useRef<ConversationAudioPlayer | null>(null)
  
  const audioElements = useRef<{ [key: string]: HTMLAudioElement }>({})

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

  // Initialize audio player
  useEffect(() => {
    if (isClientSide && !audioPlayerRef.current) {
      audioPlayerRef.current = new ConversationAudioPlayer(
        (state) => setAudioPlayerState(state),
        (messageIndex, agent) => setPlaybackHighlightedMessage({messageIndex, agent})
      )
      console.log('🎵 Audio player initialized')
    }

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy()
        audioPlayerRef.current = null
      }
    }
  }, [isClientSide])

  // Load settings from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClientSide(true)
      
      const initialConversationId = generateId()
      setConversationId(initialConversationId)
      activeConversationIdRef.current = initialConversationId
      
      audioElements.current = {
        ai1: new Audio(),
        ai2: new Audio(),
      }
      console.log('🔊 Audio elements initialized on client side')

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
          direction: savedSettings.conversationDirection,
          conversationId: initialConversationId
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
    log(`🔄 State sync: isActive = ${state.isActive}, messageCount = ${state.messages.length}, activeConversationId = ${activeConversationIdRef.current}`)
  }, [state.isActive, state.messages])

  const log = useCallback((message: string, data?: any) => {
    debugLog(message, data)
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry, data || '')
    setDebugLogs(prev => [...prev.slice(-19), logEntry])
  }, [])

  // FIXED: Get conversation history with NO NAMES and proper deduplication
  const getCurrentConversationHistory = useCallback((forAI: 'ai1' | 'ai2') => {
    const messages = currentMessagesRef.current
    
    // Get only assistant messages (actual AI responses) for conversation context
    const conversationMessages = messages
      .filter(msg => msg.role === 'assistant' && msg.agent) // Only AI messages with valid agents
      .map((msg) => {
        // FIXED: Build CLEAN perspective with NO NAMES
        if (msg.agent === forAI) {
          return {
            role: 'assistant' as const,
            content: msg.content
            // NO name field!
          }
        } else {
          return {
            role: 'user' as const,
            content: msg.content
            // NO name field!
          }
        }
      })
      .slice(-8) // Keep last 8 messages for context (4 turns each)

    log(`📚 CLEAN: Built conversation history for ${forAI}:`, {
      historyLength: conversationMessages.length,
      totalMessagesInState: messages.length,
      perspective: `${forAI} sees their own messages as 'assistant', other AI as 'user'`,
      hasNames: conversationMessages.some(m => 'name' in m),
      lastRole: conversationMessages.length > 0 ? conversationMessages[conversationMessages.length - 1].role : 'none'
    })

    return conversationMessages
  }, [log])

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
    
    const currentConversationId = activeConversationIdRef.current
    log(`🎵 Generating TTS for ${aiId}: "${text.substring(0, 50)}..." with conversationId: ${currentConversationId}`)
    
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
          conversation_id: currentConversationId,
          message_index: messageIndex,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown TTS error' }))
        throw new Error(errorData.error || `TTS API error: ${response.status}`)
      }
      
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      log(`✅ TTS audio generated for ${aiId}, size: ${audioBlob.size} bytes, saved to conversation: ${currentConversationId}`)
      
      if (isClientSide && audioElements.current[aiId]) {
        const audio = audioElements.current[aiId]
        
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

  // FIXED: Streamlined processTurn function with CLEAN API calls - NO DUPLICATES
  const processTurn = async (
    currentAi: 'ai1' | 'ai2',
    promptMessage: string,
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

      log(`📞 Getting AI response for ${currentAi} with prompt: "${promptMessage.substring(0, 50)}..."`)
      
      // FIXED: Get CLEAN conversation history (no names, no duplicates)
      const conversationHistory = getCurrentConversationHistory(currentAi)
      const config = currentAi === 'ai1' ? ai1Config : ai2Config
      
      // FIXED: Build CLEAN messages for API call - NO NAMES, NO DUPLICATES
      const messages = [
        {
          role: 'system',
          content: `${config.prompt}\n\nYou are ${config.name}, engaging in a conversation with another AI assistant. Keep your responses natural, thoughtful, and conversational. Build upon the conversation history and respond directly to what was just said. Avoid repeating information already covered unless it adds new insight.`
        },
        ...conversationHistory,
        // FIXED: Only add prompt if it's not already in history
        ...(conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].content !== promptMessage
          ? [{
              role: 'user' as const,
              content: promptMessage
            }]
          : [])
      ]

      log(`📤 CLEAN: Sending API request for ${currentAi} (${config.name}):`, {
        totalMessages: messages.length,
        systemMessage: 1,
        historyMessages: conversationHistory.length,
        newPromptAdded: conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].content !== promptMessage,
        lastUserMessage: promptMessage.substring(0, 50) + '...',
        messagesWithNames: messages.filter(m => 'name' in m).length,
        duplicateCheck: messages.filter((m, i, arr) => 
          arr.findIndex(m2 => m2.role === m.role && m2.content === m.content) !== i
        ).length
      })

      // Make API call
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
        log(`✅ ${currentAi} response received:`, {
          length: responseContent.length,
          preview: responseContent.substring(0, 100) + '...'
        })

        // Check for conversation end
        if (responseContent && responseContent.includes('#END#')) {
          log(`🔚 ${currentAi} responded with #END#. Ending conversation.`)
          setTypingIndicator(currentAi, false)
          isConversationActiveRef.current = false
          stopConversation('Conversation has ended naturally')
          return
        }

        setTypingIndicator(currentAi, false)

        if (!responseContent || responseContent.trim() === '') {
          throw new Error(`Empty response from ${currentAi}`)
        }

        const messageIndex = currentMessagesRef.current.length
        log(`💬 Adding message from ${currentAi}, index: ${messageIndex}`)
        
        // Add message to conversation history
        addMessage({
          role: 'assistant',
          content: responseContent,
          agent: currentAi,
          model: config.model,
        })

        log(`🎵 Starting TTS for ${currentAi} and WAITING for completion...`)
        await speakText(currentAi, responseContent, messageIndex)
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
        
        // Continue conversation with the other AI, using current AI's response as prompt
        await processTurn(otherAi, responseContent, false)
        
      } else {
        throw new Error('Invalid response format from API')
      }
      
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
    log('🚀 STARTING CLEAN AI CONVERSATION', {
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
      activeConversationIdRef.current = newConversationId
      setHasAudio(false)
      
      log('🎬 Initializing new CLEAN conversation', {
        newConversationId,
        messagesAfterReset: currentMessagesRef.current.length
      })
      
      isConversationActiveRef.current = true
      startConversation()

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

      log(`📝 CLEAN: Adding initial message from ${sender} to start conversation`)

      const initialMessageIndex = 0
      
      // Add the initial message to conversation history FIRST
      addMessage({
        role: 'assistant',
        content: message,
        agent: sender,
        model: sender === 'ai1' ? ai1Config.model : ai2Config.model,
      })

      log(`🎵 Generating TTS for initial message from ${sender} with conversationId: ${newConversationId}`)
      await speakText(sender, message, initialMessageIndex)

      toast.success('Clean AI Conversation Started', {
        description: `No names, no duplicates: ${sender} → ${receiver}`,
        duration: 3000
      })

      log(`🎯 CLEAN: Starting conversation flow with ${receiver} responding to: "${message.substring(0, 50)}..."`)
      
      // Start conversation with the receiver, passing the initial message as the prompt
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
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop()
    }
    
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
        id: activeConversationIdRef.current,
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
          conversation_id: activeConversationIdRef.current,
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
    const currentConversationId = activeConversationIdRef.current
    
    if (!audioPlayerRef.current) {
      toast.error('Audio Player Not Ready', {
        description: 'Audio player is not initialized.'
      })
      return
    }

    log(`🎵 Starting sequential audio playback for conversation: ${currentConversationId}`)
    
    try {
      const success = await audioPlayerRef.current.loadConversation(currentConversationId, state.messages)
      
      if (!success) {
        toast.warning('No Audio Available', {
          description: `No audio files available for this conversation.`
        })
        return
      }

      await audioPlayerRef.current.play()
      
      toast.success('Conversation Playback Started', {
        description: `Playing ${audioPlayerState.totalFiles} audio messages sequentially`,
        duration: 3000
      })
      
    } catch (error) {
      log(`❌ Error starting audio playback:`, error)
      toast.error('Audio Playback Error', {
        description: 'Failed to start conversation playback.'
      })
    }
  }

  const handlePauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
    }
  }

  const handleStopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop()
    }
  }

  const handleNextAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.next()
    }
  }

  const handlePreviousAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.previous()
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
            <Link href="/">
              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <BrainCircuit className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    AI Conversation System
                  </h1>
                  <p className="text-sm text-muted-foreground">Clean AI Collaboration Platform</p>
                </div>
              </div>
            </Link>
          
          <div className="flex items-center gap-2">
            {/* Audio Player Controls */}
            {hasAudio && state.messages.length > 0 && (
              <div className="flex items-center gap-1 border rounded-lg p-1">
                {!audioPlayerState.isPlaying ? (
                  <Button variant="ghost" size="sm" onClick={handlePlayAudio}>
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={handlePauseAudio}>
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleStopAudio} disabled={!audioPlayerState.isPlaying && !audioPlayerState.isPaused}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePreviousAudio} disabled={audioPlayerState.currentIndex <= 0}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNextAudio} disabled={audioPlayerState.currentIndex >= audioPlayerState.totalFiles - 1}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                {audioPlayerState.totalFiles > 0 && (
                  <span className="text-xs text-muted-foreground px-2">
                    {audioPlayerState.currentIndex + 1}/{audioPlayerState.totalFiles}
                  </span>
                )}
              </div>
            )}
            
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
            <span>CLEAN Debug Console - Active: {activeConversationIdRef.current} | Playback: {playbackHighlightedMessage.messageIndex} | Messages: {state.messages.length}</span>
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
              ai1Config={ai1Config}
              ai2Config={ai2Config}
              playbackHighlightedMessage={playbackHighlightedMessage}
            />
          </div>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="border-t bg-gradient-to-r from-background to-muted/30 py-4 flex-shrink-0 mt-auto">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Clean Conversations</span>
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