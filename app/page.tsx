// app/page.tsx - MAIN COMPONENT: Premium AI Conversation Interface
'use client'

import * as React from "react"
import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, 
  Sparkles, 
  Bot,
  Zap,
  ArrowRight,
  BrainCircuit,
  Volume2,
  Share2,
  Plus,
  Info,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConversationProvider, useConversation } from '@/contexts/ConversationContext'
import { ConversationDisplay } from '@/components/ai-conversation/conversation-display'
import { ConversationFlow } from '@/components/ai-conversation/conversation-flow'
import { PremiumSettingsPanel } from '@/components/ai-conversation/premium-settings-panel'
import { useConversationManager } from '@/hooks/useConversationManager'
import { 
  loadConversationSettings, 
  saveConversationSettings,
  debouncedSaveAI1Config,
  debouncedSaveAI2Config,
  debouncedSaveStartingMessage,
  debouncedSaveCommonSystemInstruction,
  DEFAULT_AI1_CONFIG,
  DEFAULT_AI2_CONFIG,
  DEFAULT_STARTING_MESSAGE,
  DEFAULT_CONVERSATION_DIRECTION,
  DEFAULT_COMMON_SYSTEM_INSTRUCTION
} from '@/lib/utils'
import { AIAgent, ConversationDirection } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

// Main application component with conversation management
function ConversationApp() {
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [ai1Config, setAI1Config] = useState<AIAgent>(DEFAULT_AI1_CONFIG)
  const [ai2Config, setAI2Config] = useState<AIAgent>(DEFAULT_AI2_CONFIG)
  const [startingMessage, setStartingMessage] = useState(DEFAULT_STARTING_MESSAGE)
  const [conversationDirection, setConversationDirection] = useState<ConversationDirection>(DEFAULT_CONVERSATION_DIRECTION)
  const [commonSystemInstruction, setCommonSystemInstruction] = useState(DEFAULT_COMMON_SYSTEM_INSTRUCTION)

  // Audio playback state for highlighting messages during replay
  const [playbackHighlightedMessage, setPlaybackHighlightedMessage] = useState<{
    messageIndex: number
    agent: 'ai1' | 'ai2' | null
  } | undefined>()

  // Conversation context
  const conversation = useConversation()

  // Conversation manager
  const conversationManager = useConversationManager(ai1Config, ai2Config)

  // Create stable log function using useCallback
  const log = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      if (data !== undefined) {
        console.log(`[AI-CONV] ${message}`, data)
      } else {
        console.log(`[AI-CONV] ${message}`)
      }
    }
  }, [])

  // Load settings on mount
  useEffect(() => {
    log('🔄 Loading conversation settings from localStorage...')
    try {
      const settings = loadConversationSettings()
      
      setAI1Config(settings.ai1Config)
      setAI2Config(settings.ai2Config)
      setStartingMessage(settings.startingMessage)
      setConversationDirection(settings.conversationDirection)
      setCommonSystemInstruction(settings.commonSystemInstruction)
      
      log('✅ Settings loaded successfully')
    } catch (error) {
      log('❌ Error loading settings:', error)
      toast.error('Failed to load settings, using defaults')
    }
  }, [log])

  // Auto-save AI configs with debouncing
  useEffect(() => {
    debouncedSaveAI1Config(ai1Config)
  }, [ai1Config])

  useEffect(() => {
    debouncedSaveAI2Config(ai2Config)
  }, [ai2Config])

  useEffect(() => {
    debouncedSaveStartingMessage(startingMessage)
  }, [startingMessage])

  useEffect(() => {
    debouncedSaveCommonSystemInstruction(commonSystemInstruction)
  }, [commonSystemInstruction])

  // Save conversation direction immediately (no debouncing needed)
  useEffect(() => {
    saveConversationSettings({ conversationDirection })
  }, [conversationDirection])

  // Handle AI config changes
  const handleAI1ConfigChange = useCallback((updates: Partial<AIAgent>) => {
    log('🎭 AI1 config update:', updates)
    setAI1Config(prev => ({ ...prev, ...updates }))
  }, [log])

  const handleAI2ConfigChange = useCallback((updates: Partial<AIAgent>) => {
    log('🎭 AI2 config update:', updates)
    setAI2Config(prev => ({ ...prev, ...updates }))
  }, [log])

  // Conversation controls
  const handleStartConversation = useCallback(async (direction: ConversationDirection, message: string) => {
    log('🎬 Starting conversation:', { direction, messageLength: message.length })
    
    // Validation
    if (!ai1Config.model || !ai2Config.model) {
      toast.error('Please select models for both AI agents in settings')
      setIsSettingsOpen(true)
      return
    }

    if (!message.trim()) {
      toast.error('Please enter a starting message')
      return
    }

    try {
      await conversationManager.startConversation(direction, message)
      log('✅ Conversation started successfully')
    } catch (error) {
      log('❌ Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    }
  }, [ai1Config.model, ai2Config.model, conversationManager, log])

  const handleStopConversation = useCallback(() => {
    log('🛑 Stopping conversation')
    conversationManager.stopConversation()
    setPlaybackHighlightedMessage(undefined)
    toast.info('Conversation stopped')
  }, [conversationManager, log])

  // Share conversation
  const handleShareConversation = useCallback(async () => {
    if (conversation.state.messages.length === 0) {
      toast.error('No conversation to share')
      return
    }

    log('📤 Sharing conversation...')
    
    try {
      // Create conversation data
      const conversationData = {
        id: Date.now().toString(),
        messages: conversation.state.messages,
        settings: {
          messageDirection: conversationDirection,
          models: {
            ai1: ai1Config.model,
            ai2: ai2Config.model
          },
          names: {
            ai1: ai1Config.name,
            ai2: ai2Config.name
          },
          prompts: {
            ai1: ai1Config.prompt,
            ai2: ai2Config.prompt
          },
          tts: {
            ai1: ai1Config.tts,
            ai2: ai2Config.tts
          },
          parameters: {
            ai1: {
              maxTokens: ai1Config.maxTokens,
              temperature: ai1Config.temperature
            },
            ai2: {
              maxTokens: ai2Config.maxTokens,
              temperature: ai2Config.temperature
            }
          }
        },
        created_at: new Date().toISOString()
      }

      const response = await fetch('/api/conversations/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationData.id,
          data: conversationData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to share conversation')
      }

      const result = await response.json()
      
      if (result.success) {
        // Copy share URL to clipboard
        await navigator.clipboard.writeText(result.shareUrl)
        
        toast.success('Conversation Shared!', {
          description: 'Share link copied to clipboard',
          duration: 5000,
          action: {
            label: 'Open',
            onClick: () => window.open(result.shareUrl, '_blank')
          }
        })
        
        log('✅ Conversation shared:', result.shareUrl)
      } else {
        throw new Error(result.error || 'Share failed')
      }
    } catch (error) {
      log('❌ Share error:', error)
      toast.error('Failed to share conversation')
    }
  }, [conversation.state.messages, conversationDirection, ai1Config, ai2Config, log])

  // Audio playback (placeholder for future implementation)
  const handlePlayAudio = useCallback(() => {
    log('🎵 Audio playback requested')
    toast.info('Audio playback feature coming soon!')
  }, [log])

  // Configuration validation
  const isConfigured = ai1Config.model && ai2Config.model
  const hasMessages = conversation.state.messages.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BrainCircuit className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Conversation System</h1>
              <p className="text-sm text-muted-foreground">
                Premium AI-to-AI Communication Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            {isConfigured && (
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3 text-green-500" />
                Ready
              </Badge>
            )}
            
            {conversationManager.isActive && (
              <Badge variant="default" className="gap-1 animate-pulse">
                <Bot className="h-3 w-3" />
                Active
              </Badge>
            )}

            {/* Navigation */}
            <Button variant="outline" size="sm" asChild>
              <Link href="/about">
                <Info className="h-4 w-4 mr-1" />
                About
              </Link>
            </Button>

            {/* Settings */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Panel - Conversation Flow */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Setup Card */}
            {!isConfigured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Configure your AI models to get started</span>
                    <Button 
                      size="sm" 
                      onClick={() => setIsSettingsOpen(true)}
                      className="ml-4"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Setup
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* AI Agents Overview */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* AI 1 */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{ai1Config.name}</p>
                        <p className="text-xs text-blue-600">AI Agent 1</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div className="truncate">
                        <strong>Model:</strong> {ai1Config.model || 'Not selected'}
                      </div>
                      {ai1Config.tts.enabled && (
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          <span>TTS: {ai1Config.tts.voice.replace('-PlayAI', '')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI 2 */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">{ai2Config.name}</p>
                        <p className="text-xs text-purple-600">AI Agent 2</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-purple-700">
                      <div className="truncate">
                        <strong>Model:</strong> {ai2Config.model || 'Not selected'}
                      </div>
                      {ai2Config.tts.enabled && (
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          <span>TTS: {ai2Config.tts.voice.replace('-PlayAI', '')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flow Direction */}
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground ml-2">
                    {conversationDirection === 'ai1-to-ai2' ? `${ai1Config.name} starts` : `${ai2Config.name} starts`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Flow Controls */}
            <ConversationFlow
              ai1Config={ai1Config}
              ai2Config={ai2Config}
              isActive={conversationManager.isActive}
              onStart={handleStartConversation}
              onStop={handleStopConversation}
              disabled={!isConfigured}
              startingMessage={startingMessage}
              onStartingMessageChange={setStartingMessage}
              conversationDirection={conversationDirection}
              onDirectionChange={setConversationDirection}
            />
          </div>

          {/* Right Panel - Conversation Display */}
          <div className="xl:col-span-3">
            <ConversationDisplay
              state={conversation.state}
              onShare={handleShareConversation}
              onPlayAudio={handlePlayAudio}
              ai1Config={ai1Config}
              ai2Config={ai2Config}
              playbackHighlightedMessage={playbackHighlightedMessage}
            />
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <PremiumSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ai1Config={ai1Config}
        ai2Config={ai2Config}
        onAI1ConfigChange={handleAI1ConfigChange}
        onAI2ConfigChange={handleAI2ConfigChange}
        commonSystemInstruction={commonSystemInstruction}
        onCommonSystemInstructionChange={setCommonSystemInstruction}
      />
    </div>
  )
}

// Main page component with providers
export default function HomePage() {
  return (
    <ConversationProvider enablePersistence maxMessages={500}>
      <ConversationApp />
    </ConversationProvider>
  )
}