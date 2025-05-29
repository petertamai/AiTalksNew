// app/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Bug, Sparkles, Zap, BrainCircuit } from 'lucide-react'
import { ConversationProvider, useConversation } from '@/contexts/ConversationContext'
import { ConversationDisplay } from '@/components/ai-conversation/conversation-display'
import { ConversationFlow } from '@/components/ai-conversation/conversation-flow'
import { PremiumSettingsPanel } from '@/components/ai-conversation/premium-settings-panel'
import { AIAgent, ConversationDirection, OpenRouterResponse } from '@/types'
import { generateId, calculateSpeakingTime, debugLog } from '@/lib/utils'
import { toast } from 'sonner'

// Enhanced AI agent configs with premium defaults
const DEFAULT_AI1_CONFIG: AIAgent = {
  id: 'ai1',
  name: 'Genesis',
  model: '',
  prompt: "You are Genesis, a curious and analytical AI with a passion for deep thinking and creative problem-solving. You approach conversations with intellectual curiosity, asking thought-provoking questions and offering unique perspectives. Your responses are insightful yet accessible, balancing sophistication with clarity. You have a natural tendency to explore the interconnections between ideas and think systemically about complex topics.",
  maxTokens: 1500,
  temperature: 0.7,
  tts: {
    enabled: true,
    voice: 'Arista-PlayAI',
  },
}

const DEFAULT_AI2_CONFIG: AIAgent = {
  id: 'ai2',
  name: 'Synthesis',
  model: '',
  prompt: "You are Synthesis, a thoughtful and empathetic AI who excels at connecting ideas and building upon conversations. You have a gift for seeing patterns and relationships that others might miss, and you're particularly skilled at bridging different viewpoints. Your responses are warm yet precise, demonstrating both emotional intelligence and analytical rigor. You naturally synthesize information from multiple perspectives to create new insights.",
  maxTokens: 1500,
  temperature: 0.6,
  tts: {
    enabled: true,
    voice: 'Angelo-PlayAI',
  },
}

function MainApp() {
  const { 
    state, 
    addMessage, 
    startConversation, 
    stopConversation, 
    setTypingIndicator, 
    setSpeakingState, 
    clearMessages 
  } = useConversation()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [ai1Config, setAI1Config] = useState<AIAgent>(DEFAULT_AI1_CONFIG)
  const [ai2Config, setAI2Config] = useState<AIAgent>(DEFAULT_AI2_CONFIG)
  const [conversationId, setConversationId] = useState('')
  const [hasAudio, setHasAudio] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false)
  
  // Use useRef to track conversation state to avoid closure issues
  const isConversationActive = useRef(false)
  
  // Initialize audio elements only on client side to avoid SSR issues
  const audioElements = useRef<{ [key: string]: HTMLAudioElement }>({})

  // Sync ref with actual state
  useEffect(() => {
    isConversationActive.current = state.isActive
    log(`🔄 State sync: isActive = ${state.isActive}, ref = ${isConversationActive.current}`)
  }, [state.isActive])

  // Initialize client-side only components
  useEffect(() => {
    setIsClientSide(true)
    setConversationId(generateId())
    
    if (typeof window !== 'undefined') {
      audioElements.current = {
        ai1: new Audio(),
        ai2: new Audio(),
      }
      console.log('🔊 Audio elements initialized on client side')
    }
  }, [])

  const log = (message: string, data?: any) => {
    debugLog(message, data)
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry, data || '')
    setDebugLogs(prev => [...prev.slice(-19), logEntry])
  }

  const getAIResponse = async (
    aiId: 'ai1' | 'ai2',
    prompt: string,
    conversationHistory: any[] = []
  ) => {
    const config = aiId === 'ai1' ? ai1Config : ai2Config
    
    log(`🤖 Getting ${aiId} response using model: ${config.model}`)
    
    const messages = [
      {
        role: 'system',
        content: `${config.prompt} Keep the conversation natural and flowing.`
      },
      ...conversationHistory.slice(-12),
      {
        role: 'user',
        content: prompt
      }
    ]

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
      return data.choices[0].message.content.trim()
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
      return
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
        const errorData = await response.json()
        throw new Error(errorData.error || `TTS API error: ${response.status}`)
      }
      
      // Get audio blob
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Play audio if client-side
      if (isClientSide && audioElements.current[aiId]) {
        const audio = audioElements.current[aiId]
        audio.src = audioUrl
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            log(`✅ Audio playback completed for ${aiId}`)
            resolve()
          }
          
          audio.onerror = (error) => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            log(`❌ Audio playback error for ${aiId}:`, error)
            reject(new Error(`Audio playback failed: ${error}`))
          }
          
          audio.play().catch((playError) => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            log(`❌ Audio play error for ${aiId}:`, playError)
            reject(new Error(`Failed to play audio: ${playError}`))
          })
        })
      } else {
        // Fallback: simulate speaking time if no audio element
        const speakingTime = calculateSpeakingTime(text)
        log(`⏱️ Simulating speaking time for ${aiId}: ${speakingTime}ms`)
        
        return new Promise(resolve => {
          setTimeout(() => {
            setSpeakingState(aiId, false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }, speakingTime)
        })
      }
      
    } catch (error) {
      log(`❌ TTS error for ${aiId}:`, error)
      setSpeakingState(aiId, false)
      
      console.warn(`TTS failed for ${aiId}, continuing without speech:`, error)
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, 800)
      })
    }
  }

  const processTurn = async (
    currentAi: 'ai1' | 'ai2',
    message: string,
    isFirstMessage = false
  ): Promise<void> => {
    log(`🎬 Processing turn for ${currentAi}, first: ${isFirstMessage}, isConversationActive: ${isConversationActive.current}`)
    
    if (!isConversationActive.current) {
      log(`❌ Conversation not active (ref), stopping turn for ${currentAi}`)
      return
    }

    try {
      await addThinkingDelay(currentAi)
      
      if (!isConversationActive.current) {
        log(`❌ Conversation stopped during thinking for ${currentAi}`)
        setTypingIndicator(currentAi, false)
        return
      }

      log(`📞 Getting AI response for ${currentAi}`)
      
      const conversationHistory = state.messages.map(msg => ({
        role: msg.role === 'human' ? 'user' : 'assistant',
        content: msg.content
      }))
      
      const response = await getAIResponse(currentAi, message, conversationHistory)
      
      if (response && response.includes('#END#')) {
        log(`🔚 ${currentAi} responded with #END#. Ending conversation.`)
        setTypingIndicator(currentAi, false)
        isConversationActive.current = false
        stopConversation('Conversation has ended naturally')
        return
      }

      setTypingIndicator(currentAi, false)

      if (!response || response.trim() === '') {
        throw new Error(`Empty response from ${currentAi}`)
      }

      const messageIndex = state.messages.length
      log(`💬 Adding message from ${currentAi}, index: ${messageIndex}`)
      
      addMessage({
        role: 'assistant',
        content: response,
        agent: currentAi,
        model: currentAi === 'ai1' ? ai1Config.model : ai2Config.model,
      })

      log(`🎵 About to call speakText for ${currentAi} with messageIndex ${messageIndex}`)
      await speakText(currentAi, response, messageIndex)
      log(`✅ speakText completed for ${currentAi}`)

      if (!isConversationActive.current) {
        log(`❌ Conversation stopped after speech for ${currentAi}`)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1200))

      const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1'
      log(`🔄 Continuing conversation with ${otherAi}`)
      await processTurn(otherAi, response, false)
      
    } catch (error) {
      log(`❌ Error in processTurn for ${currentAi}: ${error}`)
      setTypingIndicator(currentAi, false)
      setSpeakingState(currentAi, false)
      isConversationActive.current = false
      
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

    if (state.isActive || isConversationActive.current) {
      toast.warning('Conversation Active', {
        description: 'A conversation is already active. Stop it first.'
      })
      return
    }

    try {
      log('🎬 Initializing premium AI conversation experience')
      
      isConversationActive.current = true
      
      clearMessages()
      startConversation()
      setConversationId(generateId())
      setHasAudio(false)

      // For AI-to-AI conversations, determine the starting AI and receiver
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
      isConversationActive.current = false
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
          messageDirection: 'ai1-to-ai2' as ConversationDirection,
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
        
        // TODO: Implement sequential audio playback with highlighting
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

  if (!isClientSide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-lg font-medium">Initializing AI Conversation System...</span>
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

      {/* Main Content Grid - With proper flex layout */}
      <main className="container mx-auto p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Panel - Conversation Flow */}
          <div className="flex flex-col space-y-6">
            <ConversationFlow 
              ai1Config={ai1Config}
              ai2Config={ai2Config}
              isActive={state.isActive}
              onStart={handleStartConversation}
              onStop={() => {
                isConversationActive.current = false
                stopConversation('Conversation stopped by user')
              }}
              disabled={false}
              className="flex-shrink-0"
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

      {/* Premium Footer - Fixed at bottom */}
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