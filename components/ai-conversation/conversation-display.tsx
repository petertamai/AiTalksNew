"use client"

import * as React from "react"
import { 
  Bot, 
  User, 
  Settings, 
  Play, 
  Share2, 
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Copy,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ConversationMessage, ConversationState } from "@/types"
import { formatTimestamp } from "@/lib/utils"

interface ConversationDisplayProps {
  state: ConversationState
  onShare?: () => void
  onPlayAudio?: () => void
  hasAudio?: boolean
  isSharedView?: boolean
  className?: string
}

interface MessageItemProps {
  message: ConversationMessage
  index: number
  isActive?: boolean
  isSpeaking?: boolean
  isTyping?: boolean
}

function MessageItem({ message, index, isActive, isSpeaking, isTyping }: MessageItemProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const getMessageStyles = () => {
    switch (message.role) {
      case 'assistant':
        if (message.agent === 'ai1') {
          return {
            container: "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200/50 ml-0 mr-8",
            avatar: "bg-blue-500/10 border-blue-500/20",
            icon: "text-blue-600",
            name: "text-blue-700",
            darkContainer: "dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800/30"
          }
        } else {
          return {
            container: "bg-gradient-to-l from-purple-50 to-purple-100/50 border-purple-200/50 ml-8 mr-0",
            avatar: "bg-purple-500/10 border-purple-500/20",
            icon: "text-purple-600", 
            name: "text-purple-700",
            darkContainer: "dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800/30"
          }
        }
      case 'human':
        return {
          container: "bg-gradient-to-r from-green-50 to-green-100/50 border-green-200/50 ml-0 mr-8",
          avatar: "bg-green-500/10 border-green-500/20", 
          icon: "text-green-600",
          name: "text-green-700",
          darkContainer: "dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800/30"
        }
      case 'system':
        return {
          container: "bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200/50 mx-8",
          avatar: "bg-gray-500/10 border-gray-500/20",
          icon: "text-gray-600",
          name: "text-gray-700", 
          darkContainer: "dark:from-gray-950/30 dark:to-gray-900/20 dark:border-gray-800/30"
        }
      default:
        return {
          container: "bg-muted/50 border-border ml-0 mr-8",
          avatar: "bg-muted border-border",
          icon: "text-muted-foreground",
          name: "text-foreground",
          darkContainer: ""
        }
    }
  }

  const styles = getMessageStyles()
  const isAI = message.role === 'assistant'
  const isSystem = message.role === 'system'

  const getAgentName = () => {
    if (message.role === 'human') return 'Human'
    if (message.role === 'system') return 'System'
    if (message.agent === 'ai1') return 'AI-1'
    if (message.agent === 'ai2') return 'AI-2'
    return 'Assistant'
  }

  const getAgentIcon = () => {
    if (message.role === 'human') return <User className="h-4 w-4" />
    if (message.role === 'system') return <Settings className="h-4 w-4" />
    return <Bot className="h-4 w-4" />
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-200",
        "hover:shadow-sm",
        styles.container,
        styles.darkContainer,
        isSpeaking && "ring-2 ring-primary/50 animate-pulse",
        isActive && "ring-2 ring-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-message-index={index}
    >
      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute -top-2 left-4 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
          <Volume2 className="h-3 w-3" />
          <span>Speaking</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0",
          styles.avatar
        )}>
          <div className={styles.icon}>
            {getAgentIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", styles.name)}>
                {getAgentName()}
              </span>
              {message.model && (
                <Badge variant="outline" className="text-xs">
                  {message.model.split('/').pop()}
                </Badge>
              )}
              {message.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
            </div>
            
            {/* Actions */}
            {(isHovered || isSpeaking) && (
              <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMessage}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-center gap-3 p-4 ml-0 mr-8">
      <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{agentName} is thinking</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ConversationDisplay({
  state,
  onShare,
  onPlayAudio, 
  hasAudio = false,
  isSharedView = false,
  className
}: ConversationDisplayProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [state.messages, scrollToBottom])

  const getStatusText = () => {
    if (state.speakingState.ai1) return 'AI-1 is speaking'
    if (state.speakingState.ai2) return 'AI-2 is speaking'
    if (state.typingIndicator.ai1) return 'AI-1 is thinking'
    if (state.typingIndicator.ai2) return 'AI-2 is thinking'
    if (state.isActive) return 'Active conversation'
    if (isSharedView) return 'Shared conversation'
    return 'Ready'
  }

  const getStatusVariant = () => {
    if (state.speakingState.ai1 || state.speakingState.ai2) return 'default'
    if (state.typingIndicator.ai1 || state.typingIndicator.ai2) return 'secondary'
    if (state.isActive) return 'default'
    return 'outline'
  }

  const hasAnyActivity = state.speakingState.ai1 || state.speakingState.ai2 || 
                        state.typingIndicator.ai1 || state.typingIndicator.ai2

  return (
    <Card className={cn("flex flex-col max-h-[80vh]", className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isSharedView ? 'Shared Conversation' : 'Live Conversation'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {state.messages.length} messages
                {hasAudio && ` • Audio available`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio Controls */}
            {hasAudio && onPlayAudio && (
              <Button variant="outline" size="sm" onClick={onPlayAudio}>
                <Play className="h-4 w-4 mr-1" />
                Play
              </Button>
            )}
            
            {/* Share Button */}
            {!isSharedView && onShare && !state.isActive && state.messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            
            {/* Status Badge */}
            <Badge 
              variant={getStatusVariant()} 
              className={cn(
                "transition-all duration-200",
                hasAnyActivity && "animate-pulse"
              )}
            >
              <div className="flex items-center gap-1">
                {hasAnyActivity && <Clock className="h-3 w-3" />}
                {getStatusText()}
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full max-h-[calc(80vh-200px)]">
          <div className="p-4 space-y-4">
            {/* Empty State */}
            {state.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {isSharedView ? 'No conversation found' : 'Ready to start'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {isSharedView 
                      ? 'This shared conversation appears to be empty or unavailable.'
                      : 'Configure your AI agents and start a conversation to see messages appear here.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                {state.messages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    index={index}
                    isSpeaking={
                      (message.agent === 'ai1' && state.speakingState.ai1) ||
                      (message.agent === 'ai2' && state.speakingState.ai2)
                    }
                  />
                ))}

                {/* Typing Indicators */}
                {state.typingIndicator.ai1 && (
                  <TypingIndicator agentName="AI-1" />
                )}
                {state.typingIndicator.ai2 && (
                  <TypingIndicator agentName="AI-2" />
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}