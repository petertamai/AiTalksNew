// app/share/[id]/SharedConversationView.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Square, 
  Settings, 
  Bot, 
  User, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2,
  Download,
  Share2,
  ExternalLink,
  Clock,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  Home
} from 'lucide-react'
import { ConversationData, ConversationMessage, AudioFileInfo } from '@/types'
import { formatTimestamp } from '@/lib/utils'
import { toast } from 'sonner'

interface PremiumSharedConversationViewProps {
  conversationData: ConversationData
  conversationId: string
  hasAudio: boolean
}

interface AudioControlsProps {
  audioFiles: AudioFileInfo[]
  conversationId: string
  onAudioStateChange: (state: any) => void
}

function AudioControls({ audioFiles, conversationId, onAudioStateChange }: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentAudio = audioFiles[currentIndex]

  useEffect(() => {
    onAudioStateChange({
      isPlaying,
      isPaused,
      currentIndex,
      progress,
      currentAudio
    })
  }, [isPlaying, isPaused, currentIndex, progress, currentAudio, onAudioStateChange])

  const loadAudio = (index: number) => {
    if (!audioRef.current || !audioFiles[index]) return

    const audioFile = audioFiles[index]
    const audioUrl = `/conversations/${conversationId}/audio/${audioFile.filename}`
    
    audioRef.current.src = audioUrl
    audioRef.current.load()
  }

  const handlePlay = async () => {
    if (!audioRef.current) return

    if (!isPlaying) {
      loadAudio(currentIndex)
    }

    try {
      if (isPaused) {
        await audioRef.current.play()
        setIsPaused(false)
        toast.info('Audio resumed')
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        toast.success('Audio playback started')
      }
    } catch (error) {
      toast.error('Failed to play audio')
      console.error('Audio play error:', error)
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPaused(true)
      toast.info('Audio paused')
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setCurrentTime(0)
    toast.info('Audio stopped')
  }

  const handleNext = () => {
    if (currentIndex < audioFiles.length - 1) {
      setCurrentIndex(prev => prev + 1)
      if (isPlaying) {
        setTimeout(() => loadAudio(currentIndex + 1), 100)
      }
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      if (isPlaying) {
        setTimeout(() => loadAudio(currentIndex - 1), 100)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget
          setCurrentTime(audio.currentTime)
          setProgress((audio.currentTime / audio.duration) * 100)
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
        }}
        onEnded={handleNext}
        onError={() => {
          toast.error('Audio playback error')
          setIsPlaying(false)
          setIsPaused(false)
        }}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Current Track Info */}
      {currentAudio && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {currentAudio.agent === 'ai1' ? (
              <Bot className="h-4 w-4 text-blue-600" />
            ) : (
              <Bot className="h-4 w-4 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentAudio.agent === 'ai1' ? 'AI-1' : 'AI-2'} - Message {currentAudio.messageIndex + 1}
            </p>
            <p className="text-xs text-muted-foreground">
              Track {currentIndex + 1} of {audioFiles.length}
            </p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex <= 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {!isPlaying ? (
          <Button onClick={handlePlay}>
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        ) : isPaused ? (
          <Button onClick={handlePlay}>
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
        ) : (
          <Button onClick={handlePause}>
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={handleStop} disabled={!isPlaying}>
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex >= audioFiles.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function MessageDisplay({ 
  message, 
  index, 
  isHighlighted, 
  agentNames 
}: { 
  message: ConversationMessage
  index: number
  isHighlighted: boolean
  agentNames: { ai1: string; ai2: string }
}) {
  const getMessageStyle = () => {
    switch (message.role) {
      case 'assistant':
        if (message.agent === 'ai1') {
          return 'conversation-message ai1'
        } else {
          return 'conversation-message ai2'
        }
      case 'human':
        return 'conversation-message human'
      case 'system':
        return 'conversation-message system'
      default:
        return 'conversation-message'
    }
  }

  const getAgentName = () => {
    if (message.role === 'human') return 'Human'
    if (message.role === 'system') return 'System'
    if (message.agent === 'ai1') return agentNames.ai1
    if (message.agent === 'ai2') return agentNames.ai2
    return 'Assistant'
  }

  const getAgentIcon = () => {
    if (message.role === 'human') return <User className="h-4 w-4" />
    if (message.role === 'system') return <Settings className="h-4 w-4" />
    return <Bot className="h-4 w-4" />
  }

  return (
    <div
      className={`${getMessageStyle()} ${isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''}`}
      data-message-index={index}
    >
      {isHighlighted && (
        <div className="absolute -top-2 left-4 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
          <Volume2 className="h-3 w-3" />
          <span>Playing</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="agent-avatar">
          {getAgentIcon()}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{getAgentName()}</span>
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
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PremiumSharedConversationView({
  conversationData,
  conversationId,
  hasAudio,
}: PremiumSharedConversationViewProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFileInfo[]>([])
  const [audioState, setAudioState] = useState<any>({})
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  const loadAudioFiles = async () => {
    if (!hasAudio) return

    setIsLoadingAudio(true)
    try {
      const response = await fetch(`/api/conversations/audio?conversation_id=${conversationId}`)
      const data = await response.json()
      
      if (data.success && data.audioFiles) {
        const parsedFiles: AudioFileInfo[] = data.audioFiles.map((filename: string) => {
          const indexMatch = filename.match(/message_(\d+)\.mp3/)
          const messageIndex = indexMatch ? parseInt(indexMatch[1]) : 0
          const message = conversationData.messages[messageIndex]
          
          return {
            filename,
            messageIndex,
            agent: message?.agent || 'ai1',
          }
        }).sort((a: AudioFileInfo, b: AudioFileInfo) => a.messageIndex - b.messageIndex)
        
        setAudioFiles(parsedFiles)
      }
    } catch (error) {
      console.error('Error loading audio files:', error)
      toast.error('Failed to load audio files')
    } finally {
      setIsLoadingAudio(false)
    }
  }

  useEffect(() => {
    if (hasAudio) {
      loadAudioFiles()
    }
  }, [hasAudio, conversationId])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const currentHighlightedMessage = audioState.isPlaying && audioState.currentAudio 
    ? audioState.currentAudio.messageIndex 
    : -1

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Conversation System</h1>
              <p className="text-sm text-muted-foreground">Shared Conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/">
                <Home className="h-4 w-4 mr-1" />
                Home
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversation Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Conversation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Participants</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{conversationData.settings?.names?.ai1 || 'AI-1'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{conversationData.settings?.names?.ai2 || 'AI-2'}</span>
                    </div>
                  </div>
                </div>

                {conversationData.settings?.models && (
                  <div>
                    <h3 className="font-medium mb-2">Models</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="truncate">
                        <strong>AI-1:</strong> {conversationData.settings.models.ai1.split('/').pop()}
                      </div>
                      <div className="truncate">
                        <strong>AI-2:</strong> {conversationData.settings.models.ai2.split('/').pop()}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Messages: {conversationData.messages?.length || 0}</div>
                    {hasAudio && <div>Audio: {audioFiles.length} files</div>}
                    {conversationData.shared_at && (
                      <div>Shared: {new Date(conversationData.shared_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Controls */}
            {hasAudio && audioFiles.length > 0 && (
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-primary" />
                    Audio Playback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAudio ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <AudioControls
                      audioFiles={audioFiles}
                      conversationId={conversationId}
                      onAudioStateChange={setAudioState}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Messages */}
          <div className="lg:col-span-3">
            <Card className="premium-card h-[calc(100vh-200px)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Conversation</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {conversationData.messages?.length || 0} messages
                        {hasAudio && ` • ${audioFiles.length} audio files`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Shared View
                  </Badge>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="p-0 h-[calc(100%-100px)]">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-4">
                    {conversationData.messages && conversationData.messages.length > 0 ? (
                      conversationData.messages.map((message, index) => (
                        <MessageDisplay
                          key={message.id}
                          message={message}
                          index={index}
                          isHighlighted={currentHighlightedMessage === index}
                          agentNames={{
                            ai1: conversationData.settings?.names?.ai1 || 'AI-1',
                            ai2: conversationData.settings?.names?.ai2 || 'AI-2'
                          }}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">No conversation found</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            This shared conversation appears to be empty or unavailable.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}