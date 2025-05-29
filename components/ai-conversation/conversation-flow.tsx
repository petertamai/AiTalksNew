// components/ai-conversation/conversation-flow.tsx
"use client"

import * as React from "react"
import { 
  Play, 
  Square, 
  MessageSquare, 
  Bot, 
  User, 
  ArrowRight,
  Sparkles,
  Zap,
  AlertCircle,
  Clock,
  Send,
  Save,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConversationDirection, AIAgent } from "@/types"
import { DEFAULT_STARTING_MESSAGE } from "@/lib/utils"
import { toast } from "sonner"

interface ConversationFlowProps {
  ai1Config: AIAgent
  ai2Config: AIAgent
  isActive: boolean
  onStart: (direction: ConversationDirection, message: string) => void
  onStop: () => void
  disabled?: boolean
  className?: string
  // New props for localStorage integration
  startingMessage: string
  onStartingMessageChange: (message: string) => void
  conversationDirection: ConversationDirection
  onDirectionChange: (direction: ConversationDirection) => void
}

const FLOW_OPTIONS: {
  id: ConversationDirection
  title: string
  description: string
  icon: React.ReactNode
  path: React.ReactNode
  gradient: string
}[] = [
  {
    id: 'ai1-to-ai2',
    title: 'AI-1 ↔ AI-2',
    description: 'Automatic conversation between both AIs',
    icon: <Zap className="h-4 w-4" />,
    path: (
      <div className="flex items-center gap-1">
        <Bot className="h-3 w-3 text-blue-500" />
        <ArrowRight className="h-3 w-3" />
        <Bot className="h-3 w-3 text-purple-500" />
      </div>
    ),
    gradient: 'from-blue-500/20 to-purple-500/20'
  },
  {
    id: 'ai2-to-ai1',
    title: 'AI-2 ↔ AI-1',
    description: 'Reverse automatic AI conversation',
    icon: <Zap className="h-4 w-4" />,
    path: (
      <div className="flex items-center gap-1">
        <Bot className="h-3 w-3 text-purple-500" />
        <ArrowRight className="h-3 w-3" />
        <Bot className="h-3 w-3 text-blue-500" />
      </div>
    ),
    gradient: 'from-purple-500/20 to-blue-500/20'
  }
]

const SAMPLE_MESSAGES = [
  "Hello! How are you today?",
  "Let's discuss the future of artificial intelligence.",
  "What are your thoughts on creativity and consciousness?",
  "Can you help me understand quantum computing?",
  "Tell me about your favorite philosophical concept.",
  "What's the most interesting thing you've learned recently?",
  "How do you approach problem-solving?",
  "What role does emotion play in decision-making?",
  "Describe your ideal conversation partner.",
  "What questions fascinate you the most?"
]

export function ConversationFlow({
  ai1Config,
  ai2Config,
  isActive,
  onStart,
  onStop,
  disabled = false,
  className,
  startingMessage,
  onStartingMessageChange,
  conversationDirection,
  onDirectionChange
}: ConversationFlowProps) {
  const [isStarting, setIsStarting] = React.useState(false)
  const [localMessage, setLocalMessage] = React.useState(startingMessage)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Sync local message with prop when it changes
  React.useEffect(() => {
    setLocalMessage(startingMessage)
    setHasUnsavedChanges(false)
  }, [startingMessage])

  // FIXED: Reset isStarting when conversation becomes inactive
  React.useEffect(() => {
    if (!isActive && isStarting) {
      console.log('🔄 Conversation stopped externally, resetting isStarting state')
      setIsStarting(false)
    }
  }, [isActive, isStarting])

  // Check for unsaved changes
  React.useEffect(() => {
    setHasUnsavedChanges(localMessage !== startingMessage)
  }, [localMessage, startingMessage])

  const canStart = !!(ai1Config.model && ai2Config.model && localMessage.trim() && !isActive && !disabled)
  
  const validationErrors = React.useMemo(() => {
    const errors: string[] = []
    if (!ai1Config.model) errors.push(`${ai1Config.name} model not selected`)
    if (!ai2Config.model) errors.push(`${ai2Config.name} model not selected`)
    if (!localMessage.trim()) errors.push('Starting message is required')
    return errors
  }, [ai1Config, ai2Config, localMessage])

  const handleStart = async () => {
    if (!canStart) return

    // Save message before starting if there are unsaved changes
    if (hasUnsavedChanges) {
      onStartingMessageChange(localMessage)
      toast.success('Message Saved', {
        description: 'Starting message has been saved to your settings.',
        duration: 2000
      })
    }

    setIsStarting(true)
    try {
      await onStart(conversationDirection, localMessage.trim())
    } finally {
      setIsStarting(false)
    }
  }

  const handleQuickMessage = (sampleMessage: string) => {
    setLocalMessage(sampleMessage)
    toast.info('Quick Message Selected', {
      description: 'Don\'t forget to save your changes!',
      duration: 2000
    })
  }

  const handleSaveMessage = () => {
    onStartingMessageChange(localMessage)
    toast.success('Message Saved', {
      description: 'Starting message has been saved to your settings.',
      duration: 2000
    })
  }

  const handleResetMessage = () => {
    setLocalMessage(DEFAULT_STARTING_MESSAGE)
    toast.info('Message Reset', {
      description: 'Starting message reset to default.',
      duration: 2000
    })
  }

  const handleDirectionChange = (newDirection: ConversationDirection) => {
    onDirectionChange(newDirection)
    toast.success('Direction Updated', {
      description: 'Conversation direction has been saved.',
      duration: 2000
    })
  }

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-background to-muted/30",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Conversation Flow</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure and start your AI-to-AI conversation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600/50 bg-yellow-50">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Configuration required:</p>
                <ul className="text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Flow Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">AI Conversation Flow</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FLOW_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleDirectionChange(option.id)}
                disabled={disabled || isActive}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200",
                  "hover:shadow-md hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  conversationDirection === option.id
                    ? "border-primary bg-gradient-to-br " + option.gradient
                    : "border-border hover:border-primary/50 bg-card",
                  (disabled || isActive) && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center",
                    conversationDirection === option.id ? "bg-primary/20" : "bg-muted"
                  )}>
                    {option.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{option.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                    <div className="flex justify-center">
                      {option.path}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Starting Message</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {localMessage.length} characters
              </Badge>
              {hasUnsavedChanges && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveMessage}
                    disabled={disabled || isActive}
                    className="h-6 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetMessage}
                    disabled={disabled || isActive}
                    className="h-6 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <Textarea
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="Enter the message that will start the AI conversation..."
            className="min-h-[100px] resize-none"
            disabled={disabled || isActive}
          />
          
          {/* Quick Messages */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick start options:</Label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MESSAGES.slice(0, 6).map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(sample)}
                  disabled={disabled || isActive}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border",
                    "hover:bg-accent transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    localMessage === sample ? "bg-primary/10 border-primary" : "border-border"
                  )}
                >
                  {sample.length > 35 ? sample.slice(0, 35) + '...' : sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isActive ? (
            <Button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="flex-1 h-11 font-medium"
              size="lg"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Starting AI Conversation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start AI Conversation
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1 h-11 font-medium"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Conversation
            </Button>
          )}
        </div>

        {/* Configuration Summary */}
        {canStart && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">AI Configuration Summary</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">{ai1Config.name}</span>
                </div>
                <p className="text-muted-foreground truncate">{ai1Config.model}</p>
                {ai1Config.tts.enabled && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      TTS: {ai1Config.tts.voice.replace('-PlayAI', '')}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3 text-purple-500" />
                  <span className="font-medium">{ai2Config.name}</span>
                </div>
                <p className="text-muted-foreground truncate">{ai2Config.model}</p>
                {ai2Config.tts.enabled && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      TTS: {ai2Config.tts.voice.replace('-PlayAI', '')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">You have unsaved changes to your starting message.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Persistence Info */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          <div className="flex items-center gap-2 mb-1">
            <Save className="h-3 w-3" />
            <span className="font-medium">Auto-Save Enabled</span>
          </div>
          <p>Your conversation settings, including starting message and flow direction, are automatically saved to your browser and will be restored when you return.</p>
        </div>
      </CardContent>
    </Card>
  )
}