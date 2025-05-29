"use client"

import * as React from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
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
  Download,
  Mic,
  PlayCircle,
  Code,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ConversationMessage, ConversationState, AIAgent } from "@/types"
import { formatTimestamp } from "@/lib/utils"
import { useTheme } from "next-themes"

interface ConversationDisplayProps {
  state: ConversationState
  onShare?: () => void
  onPlayAudio?: () => void
  hasAudio?: boolean
  isSharedView?: boolean
  className?: string
  // NEW: Agent configs to get real names
  ai1Config?: AIAgent
  ai2Config?: AIAgent
  // NEW: Playback highlighting support
  playbackHighlightedMessage?: {
    messageIndex: number
    agent: 'ai1' | 'ai2' | null
  }
}

interface MessageItemProps {
  message: ConversationMessage
  index: number
  isActive?: boolean
  isSpeaking?: boolean
  isTyping?: boolean
  // NEW: Agent configs for real names
  ai1Config?: AIAgent
  ai2Config?: AIAgent
  // NEW: Playback highlighting
  isPlaybackHighlighted?: boolean
}

// Enhanced Markdown Components with Premium Styling
function MarkdownRenderer({ content }: { content: string }) {
  const { theme } = useTheme()
  const [copied, setCopied] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const components = {
    // Code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const codeId = React.useId()
      
      if (!inline && match) {
        return (
          <div className="relative group my-4">
            <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border border-b-0">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Code className="h-4 w-4" />
                {match[1]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied === codeId ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={theme === 'dark' ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              className="!mt-0 !rounded-t-none border border-t-0 rounded-b-lg"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        )
      }

      // Inline code
      return (
        <code
          className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
          {...props}
        >
          {children}
        </code>
      )
    },

    // Enhanced blockquotes
    blockquote({ children }: any) {
      return (
        <blockquote className="mt-6 border-l-4 border-primary pl-6 italic text-muted-foreground">
          {children}
        </blockquote>
      )
    },

    // Enhanced tables
    table({ children }: any) {
      return (
        <div className="my-6 w-full overflow-y-auto">
          <table className="w-full border-collapse border border-border">
            {children}
          </table>
        </div>
      )
    },

    th({ children }: any) {
      return (
        <th className="border border-border px-4 py-2 text-left font-bold bg-muted">
          {children}
        </th>
      )
    },

    td({ children }: any) {
      return (
        <td className="border border-border px-4 py-2">
          {children}
        </td>
      )
    },

    // Enhanced links
    a({ href, children }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
        >
          {children}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },

    // Enhanced headings
    h1({ children }: any) {
      return (
        <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl mt-6 mb-4">
          {children}
        </h1>
      )
    },

    h2({ children }: any) {
      return (
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">
          {children}
        </h2>
      )
    },

    h3({ children }: any) {
      return (
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2">
          {children}
        </h3>
      )
    },

    // Enhanced lists
    ul({ children }: any) {
      return (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          {children}
        </ul>
      )
    },

    ol({ children }: any) {
      return (
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
          {children}
        </ol>
      )
    },

    // Enhanced paragraphs
    p({ children }: any) {
      return (
        <p className="leading-7 [&:not(:first-child)]:mt-4">
          {children}
        </p>
      )
    },

    // Enhanced emphasis
    strong({ children }: any) {
      return <strong className="font-semibold">{children}</strong>
    },

    em({ children }: any) {
      return <em className="italic">{children}</em>
    },

    // Horizontal rules
    hr() {
      return <hr className="my-6 border-border" />
    },
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
        className="leading-relaxed"
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function MessageItem({ 
  message, 
  index, 
  isActive, 
  isSpeaking, 
  isTyping, 
  ai1Config,
  ai2Config,
  isPlaybackHighlighted = false 
}: MessageItemProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

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

  // UPDATED: Get real agent names instead of AI-1/AI-2
  const getAgentName = () => {
    if (message.role === 'human') return 'Human'
    if (message.role === 'system') return 'System'
    if (message.agent === 'ai1' && ai1Config?.name) return ai1Config.name
    if (message.agent === 'ai2' && ai2Config?.name) return ai2Config.name
    // Fallback to default names
    if (message.agent === 'ai1') return 'AI Assistant'
    if (message.agent === 'ai2') return 'AI Assistant'
    return 'Assistant'
  }

  // NEW: Get agent ID for badge display
  const getAgentId = () => {
    if (message.agent === 'ai1') return 'AI-1'
    if (message.agent === 'ai2') return 'AI-2'
    return null
  }

  const getAgentIcon = () => {
    if (message.role === 'human') return <User className="h-4 w-4" />
    if (message.role === 'system') return <Settings className="h-4 w-4" />
    return <Bot className="h-4 w-4" />
  }

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy message: ', err)
    }
  }

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-300",
        "hover:shadow-sm",
        styles.container,
        styles.darkContainer,
        // Live speaking (during conversation)
        isSpeaking && "ring-2 ring-primary/50 shadow-lg transform scale-[1.02]",
        // Playback highlighting (during audio replay)
        isPlaybackHighlighted && "ring-2 ring-green-500/50 shadow-lg bg-green-50/20 transform scale-[1.01]",
        isActive && "ring-2 ring-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-message-index={index}
    >
      {/* Live Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute -top-3 left-4 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs shadow-lg z-10 animate-pulse">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-3 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-3 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <Mic className="h-3 w-3" />
          <span className="font-medium">Speaking...</span>
        </div>
      )}

      {/* Playback Highlighting Indicator */}
      {isPlaybackHighlighted && !isSpeaking && (
        <div className="absolute -top-3 left-4 flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs shadow-lg z-10 animate-pulse">
          <PlayCircle className="h-3 w-3" />
          <span className="font-medium">Playing Audio...</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar with Animation */}
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200",
          styles.avatar,
          isSpeaking && "ring-2 ring-primary/50 ring-offset-2 animate-pulse",
          isPlaybackHighlighted && !isSpeaking && "ring-2 ring-green-500/50 ring-offset-2 animate-pulse"
        )}>
          <div className={styles.icon}>
            {getAgentIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header with REAL agent names */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* MAIN NAME: Real agent name */}
              <span className={cn("text-sm font-medium", styles.name)}>
                {getAgentName()}
              </span>
              
              {/* SECONDARY BADGES: Agent ID and Model */}
              <div className="flex items-center gap-1">
                {/* Agent ID badge (AI-1/AI-2) as grey badge on the right */}
                {getAgentId() && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                    {getAgentId()}
                  </Badge>
                )}
                
                {/* Model badge */}
                {message.model && (
                  <Badge variant="outline" className="text-xs">
                    {message.model.split('/').pop()}
                  </Badge>
                )}
              </div>
              
              {/* Timestamp */}
              {message.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
              
              {/* Show playback status */}
              {isPlaybackHighlighted && (
                <Badge variant="default" className="text-xs bg-green-500/20 text-green-700 border-green-500/30">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Audio Playing
                </Badge>
              )}
            </div>
            
            {/* Actions */}
            {(isHovered || isSpeaking || isPlaybackHighlighted) && (
              <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMessage}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Message Content with Markdown Rendering */}
          <div className={cn(
            "transition-all duration-300",
            isSpeaking && "text-primary",
            isPlaybackHighlighted && !isSpeaking && "text-green-700"
          )}>
            <MarkdownRenderer content={message.content} />
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
  className,
  ai1Config,
  ai2Config,
  playbackHighlightedMessage
}: ConversationDisplayProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [state.messages, scrollToBottom])

  // Auto-scroll to currently playing message during playback
  React.useEffect(() => {
    if (playbackHighlightedMessage && playbackHighlightedMessage.messageIndex >= 0) {
      const messageElement = document.querySelector(`[data-message-index="${playbackHighlightedMessage.messageIndex}"]`)
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [playbackHighlightedMessage])

  const getStatusText = () => {
    // Playback status takes priority
    if (playbackHighlightedMessage && playbackHighlightedMessage.messageIndex >= 0) {
      return `Playing message ${playbackHighlightedMessage.messageIndex + 1}`
    }
    
    // Use real agent names in status
    const ai1Name = ai1Config?.name || 'AI-1'
    const ai2Name = ai2Config?.name || 'AI-2'
    
    if (state.speakingState.ai1) return `${ai1Name} is speaking`
    if (state.speakingState.ai2) return `${ai2Name} is speaking`
    if (state.typingIndicator.ai1) return `${ai1Name} is thinking`
    if (state.typingIndicator.ai2) return `${ai2Name} is thinking`
    if (state.isActive) return 'Active conversation'
    if (isSharedView) return 'Shared conversation'
    return 'Ready'
  }

  const getStatusVariant = () => {
    // Playback status
    if (playbackHighlightedMessage && playbackHighlightedMessage.messageIndex >= 0) return 'default'
    
    if (state.speakingState.ai1 || state.speakingState.ai2) return 'default'
    if (state.typingIndicator.ai1 || state.typingIndicator.ai2) return 'secondary'
    if (state.isActive) return 'default'
    return 'outline'
  }

  const hasAnyActivity = state.speakingState.ai1 || state.speakingState.ai2 || 
                        state.typingIndicator.ai1 || state.typingIndicator.ai2 ||
                        (playbackHighlightedMessage && playbackHighlightedMessage.messageIndex >= 0)

  // Determine which message is currently speaking (live conversation)
  const getCurrentlySpeakingMessageIndex = () => {
    if (!state.speakingState.ai1 && !state.speakingState.ai2) return -1
    
    const speakingAgent = state.speakingState.ai1 ? 'ai1' : 'ai2'
    
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].agent === speakingAgent) {
        return i
      }
    }
    return -1
  }

  const currentlySpeakingMessageIndex = getCurrentlySpeakingMessageIndex()

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
                {(state.speakingState.ai1 || state.speakingState.ai2) && ' • Live audio'}
                {(playbackHighlightedMessage && playbackHighlightedMessage.messageIndex >= 0) && ' • Playing back'}
                {' • Enhanced markdown rendering'}
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
                      : 'Configure your AI agents and start a conversation. Messages will be beautifully rendered with markdown support!'
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
                    ai1Config={ai1Config}
                    ai2Config={ai2Config}
                    // Live speaking (during conversation)
                    isSpeaking={index === currentlySpeakingMessageIndex}
                    // Playback highlighting (during audio replay)
                    isPlaybackHighlighted={
                      playbackHighlightedMessage?.messageIndex === index && 
                      playbackHighlightedMessage?.agent === message.agent
                    }
                  />
                ))}

                {/* Typing Indicators with real names */}
                {state.typingIndicator.ai1 && (
                  <TypingIndicator agentName={ai1Config?.name || 'AI-1'} />
                )}
                {state.typingIndicator.ai2 && (
                  <TypingIndicator agentName={ai2Config?.name || 'AI-2'} />
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