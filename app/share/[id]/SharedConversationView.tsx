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
  Share2,
  Clock,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  Home,
  Copy,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Mic,
  PlayCircle
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
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentAudio = audioFiles[currentIndex]

  useEffect(() => {
    onAudioStateChange({
      isPlaying,
      isPaused,
      currentIndex,
      progress,
      currentAudio,
      error
    })
  }, [isPlaying, isPaused, currentIndex, progress, currentAudio, error, onAudioStateChange])

  const loadAudio = (index: number) => {
    if (!audioRef.current || !audioFiles[index]) {
      console.error('Cannot load audio: missing audio ref or file')
      return false
    }

    const audioFile = audioFiles[index]
    const audioUrl = `/conversations/${conversationId}/audio/${audioFile.filename}`
    
    console.log(`🎵 Loading audio ${index + 1}/${audioFiles.length}:`, audioUrl)
    
    // Reset previous state
    setError(null)
    setProgress(0)
    setCurrentTime(0)
    
    // Set new source and load
    audioRef.current.src = audioUrl
    audioRef.current.load()
    
    return true
  }

  const handlePlay = async () => {
    if (!audioRef.current || audioFiles.length === 0) {
      toast.error('No audio available to play')
      return
    }

    try {
      // If paused, just resume
      if (isPaused && audioRef.current.src) {
        await audioRef.current.play()
        setIsPaused(false)
        setIsPlaying(true)
        toast.info(`▶️ Resumed track ${currentIndex + 1}/${audioFiles.length}`)
        return
      }

      // If not playing, load and start current track
      if (!isPlaying) {
        const loaded = loadAudio(currentIndex)
        if (!loaded) {
          toast.error('Failed to load audio file')
          return
        }

        // Wait for audio to be ready, then play
        setTimeout(async () => {
          if (audioRef.current) {
            try {
              await audioRef.current.play()
              setIsPlaying(true)
              setIsPaused(false)
              toast.success(`🎵 Playing conversation: ${audioFiles.length} tracks`)
            } catch (playError) {
              console.error('Failed to start playback:', playError)
              setError('Failed to start playback')
              toast.error('Failed to start audio playback')
            }
          }
        }, 300) // Give more time for loading
      }
    } catch (error) {
      console.error('Audio play error:', error)
      setError('Failed to play audio')
      toast.error('Failed to play audio')
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPaused(true)
      setIsPlaying(false)
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
    setError(null)
    toast.info('Audio stopped')
  }

  const handleNext = async (autoPlay = false) => {
    if (currentIndex < audioFiles.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      
      if (isPlaying || autoPlay) {
        setTimeout(async () => {
          loadAudio(nextIndex)
          // Wait a bit for audio to load, then play
          setTimeout(async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play()
                setIsPlaying(true)
                setIsPaused(false)
                console.log(`🎵 Auto-playing next track: ${nextIndex + 1}/${audioFiles.length}`)
                if (autoPlay) {
                  toast.info(`🎵 Auto-advancing: ${nextIndex + 1}/${audioFiles.length}`, { duration: 2000 })
                }
              } catch (error) {
                console.error('Failed to auto-play next track:', error)
                setError('Failed to play next track')
              }
            }
          }, 200)
        }, 100)
      }
      
      if (!autoPlay) {
        toast.info(`Next track: ${nextIndex + 1}/${audioFiles.length}`)
      }
    }
  }

  const handlePrevious = async (autoPlay = false) => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      
      if (isPlaying || autoPlay) {
        setTimeout(async () => {
          loadAudio(prevIndex)
          // Wait a bit for audio to load, then play
          setTimeout(async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play()
                setIsPlaying(true)
                setIsPaused(false)
                console.log(`🎵 Auto-playing previous track: ${prevIndex + 1}/${audioFiles.length}`)
                if (autoPlay) {
                  toast.info(`🎵 Playing previous: ${prevIndex + 1}/${audioFiles.length}`, { duration: 2000 })
                }
              } catch (error) {
                console.error('Failed to auto-play previous track:', error)
                setError('Failed to play previous track')
              }
            }
          }, 200)
        }, 100)
      }
      
      if (!autoPlay) {
        toast.info(`Previous track: ${prevIndex + 1}/${audioFiles.length}`)
      }
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
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
          if (audio.duration > 0) {
            setCurrentTime(audio.currentTime)
            setProgress((audio.currentTime / audio.duration) * 100)
          }
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
        }}
        onEnded={() => {
          console.log('🎵 Audio ended, moving to next track automatically')
          if (currentIndex < audioFiles.length - 1) {
            handleNext(true) // autoPlay = true for automatic progression
          } else {
            handleStop()
            toast.success('🎉 Conversation playback completed!')
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e)
          setError('Audio playback error')
          setIsPlaying(false)
          setIsPaused(false)
          toast.error('Audio playback error')
        }}
        onLoadStart={() => {
          console.log('🎵 Audio load started')
        }}
        onCanPlay={() => {
          console.log('🎵 Audio can play')
          setError(null)
        }}
      />

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Current Track Info with Auto-Play Indicator */}
      {currentAudio && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {isPlaying ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ) : (
              currentAudio.agent === 'ai1' ? (
                <Bot className="h-4 w-4 text-blue-600" />
              ) : (
                <Bot className="h-4 w-4 text-purple-600" />
              )
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentAudio.agent === 'ai1' ? 'AI-1' : 'AI-2'} - Message {currentAudio.messageIndex + 1}
              {isPlaying && <span className="text-green-600 ml-2">🎵 Playing</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              Track {currentIndex + 1} of {audioFiles.length}
              {audioFiles.length > 1 && isPlaying && (
                <span className="text-blue-600 ml-2">• Auto-advancing</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrevious(false)}
          disabled={currentIndex <= 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {!isPlaying ? (
          <Button onClick={handlePlay} disabled={audioFiles.length === 0}>
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

        <Button variant="outline" size="sm" onClick={handleStop} disabled={!isPlaying && !isPaused}>
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNext(false)}
          disabled={currentIndex >= audioFiles.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Audio info with playback mode */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>{audioFiles.length} audio files available</p>
        {audioFiles.length > 1 && (
          <p className="text-blue-600 font-medium">
            🔄 Auto-advance mode: Will play all tracks sequentially
          </p>
        )}
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
  const [copied, setCopied] = useState(false)

  const getMessageStyle = () => {
    switch (message.role) {
      case 'assistant':
        if (message.agent === 'ai1') {
          return 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200/50 ml-0 mr-8'
        } else {
          return 'bg-gradient-to-l from-purple-50 to-purple-100/50 border-purple-200/50 ml-8 mr-0'
        }
      case 'human':
        return 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200/50 ml-0 mr-8'
      case 'system':
        return 'bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200/50 mx-8'
      default:
        return 'bg-muted/50 border-border ml-0 mr-8'
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

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Message copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy message')
    }
  }

  return (
    <div
      className={`group relative p-4 rounded-lg border transition-all duration-300 hover:shadow-sm ${getMessageStyle()} ${
        isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      data-message-index={index}
    >
      {isHighlighted && (
        <div className="absolute -top-2 left-4 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
          <PlayCircle className="h-3 w-3" />
          <span>Playing</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center flex-shrink-0">
          {getAgentIcon()}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={copyMessage}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

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
      console.log('🎵 Loading audio files for shared conversation:', conversationId)
      const response = await fetch(`/api/conversations/audio?conversation_id=${conversationId}`)
      const data = await response.json()
      
      if (data.success && data.audioFiles && data.audioFiles.length > 0) {
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
        console.log('✅ Audio files loaded:', parsedFiles.length)
      } else {
        console.log('🔇 No audio files found')
      }
    } catch (error) {
      console.error('❌ Error loading audio files:', error)
      toast.error('Failed to load audio files')
    } finally {
      setIsLoadingAudio(false)
    }
  }

  useEffect(() => {
    if (hasAudio) {
      loadAudioFiles()
    }
  }, [hasAudio, conversationId, conversationData])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Conversation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants
                  </h3>
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
                    <h3 className="font-medium mb-2">AI Models</h3>
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
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      <span>Messages: {conversationData.messages?.length || 0}</span>
                    </div>
                    {hasAudio && (
                      <div className="flex items-center gap-2">
                        <Mic className="h-3 w-3" />
                        <span>Audio: {audioFiles.length} files</span>
                      </div>
                    )}
                    {conversationData.created_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(conversationData.created_at)}</span>
                      </div>
                    )}
                    {conversationData.shared_at && (
                      <div className="flex items-center gap-2">
                        <Share2 className="h-3 w-3" />
                        <span>Shared: {formatDate(conversationData.shared_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Controls */}
            {hasAudio && (
              <Card>
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
                  ) : audioFiles.length > 0 ? (
                    <AudioControls
                      audioFiles={audioFiles}
                      conversationId={conversationId}
                      onAudioStateChange={setAudioState}
                    />
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No audio files available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Messages */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)]">
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