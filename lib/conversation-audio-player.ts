// lib/conversation-audio-player.ts
export interface AudioFile {
    filename: string
    messageIndex: number
    agent: 'ai1' | 'ai2'
    url: string
  }
  
  export interface AudioPlayerState {
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
  
  export class ConversationAudioPlayer {
    private audioFiles: AudioFile[] = []
    private currentAudio: HTMLAudioElement | null = null
    private currentIndex = 0
    private isPlaying = false
    private isPaused = false
    private onStateChange: (state: AudioPlayerState) => void
    private onMessageHighlight: (messageIndex: number, agent: 'ai1' | 'ai2' | null) => void
  
    constructor(
      onStateChange: (state: AudioPlayerState) => void,
      onMessageHighlight: (messageIndex: number, agent: 'ai1' | 'ai2' | null) => void
    ) {
      this.onStateChange = onStateChange
      this.onMessageHighlight = onMessageHighlight
    }
  
    async loadConversation(conversationId: string): Promise<boolean> {
      try {
        console.log('🎵 Loading audio files for conversation:', conversationId)
        
        const response = await fetch(`/api/conversations/audio?conversation_id=${conversationId}`)
        const data = await response.json()
        
        if (!data.success || !data.audioFiles || data.audioFiles.length === 0) {
          console.log('❌ No audio files found for conversation')
          return false
        }
  
        // Parse and sort audio files
        this.audioFiles = data.audioFiles.map((filename: string) => {
          const indexMatch = filename.match(/message_(\d+)\.mp3/)
          const messageIndex = indexMatch ? parseInt(indexMatch[1]) : 0
          
          // Determine agent based on message index (even = ai1, odd = ai2 for most cases)
          // We'll need to get this from the actual message data
          const agent = messageIndex % 2 === 0 ? 'ai1' : 'ai2' // Simplified logic
          
          return {
            filename,
            messageIndex,
            agent,
            url: `/conversations/${conversationId}/audio/${filename}`
          }
        }).sort((a: AudioFile, b: AudioFile) => a.messageIndex - b.messageIndex)
  
        console.log('✅ Loaded audio files:', this.audioFiles.length)
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
  
      if (this.currentAudio) {
        state.progress = this.currentAudio.duration > 0 
          ? (this.currentAudio.currentTime / this.currentAudio.duration) * 100 
          : 0
        state.currentTime = this.currentAudio.currentTime
        state.duration = this.currentAudio.duration
      }
  
      this.onStateChange(state)
    }
  
    async play(): Promise<void> {
      if (this.audioFiles.length === 0) {
        console.log('❌ No audio files to play')
        return
      }
  
      if (this.isPaused && this.currentAudio) {
        // Resume current audio
        try {
          await this.currentAudio.play()
          this.isPaused = false
          this.isPlaying = true
          this.updateState()
          console.log('▶️ Resumed audio playback')
        } catch (error) {
          console.error('❌ Failed to resume audio:', error)
        }
        return
      }
  
      // Start from beginning or continue from current index
      this.isPlaying = true
      this.isPaused = false
      await this.playCurrentFile()
    }
  
    private async playCurrentFile(): Promise<void> {
      if (this.currentIndex >= this.audioFiles.length) {
        console.log('✅ Conversation playback completed')
        this.stop()
        return
      }
  
      const currentFile = this.audioFiles[this.currentIndex]
      console.log(`🎵 Playing file ${this.currentIndex + 1}/${this.audioFiles.length}:`, currentFile.filename)
  
      // Highlight current message
      this.onMessageHighlight(currentFile.messageIndex, currentFile.agent)
  
      // Clean up previous audio
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.src = ''
      }
  
      // Create new audio element
      this.currentAudio = new Audio(currentFile.url)
      
      // Set up event listeners
      this.currentAudio.addEventListener('timeupdate', () => {
        this.updateState()
      })
  
      this.currentAudio.addEventListener('loadedmetadata', () => {
        this.updateState()
      })
  
      this.currentAudio.addEventListener('ended', () => {
        console.log(`✅ Completed playing: ${currentFile.filename}`)
        
        // Clear highlight for current message
        this.onMessageHighlight(-1, null)
        
        // Move to next file
        this.currentIndex++
        
        if (this.isPlaying && this.currentIndex < this.audioFiles.length) {
          // Brief pause between files for natural flow
          setTimeout(() => {
            if (this.isPlaying) {
              this.playCurrentFile()
            }
          }, 500)
        } else {
          console.log('🎉 Conversation playback completed!')
          this.stop()
        }
      })
  
      this.currentAudio.addEventListener('error', (error) => {
        console.error(`❌ Audio error for ${currentFile.filename}:`, error)
        
        // Skip to next file on error
        this.currentIndex++
        if (this.isPlaying && this.currentIndex < this.audioFiles.length) {
          setTimeout(() => {
            if (this.isPlaying) {
              this.playCurrentFile()
            }
          }, 100)
        } else {
          this.stop()
        }
      })
  
      try {
        await this.currentAudio.play()
        this.updateState()
        console.log(`▶️ Started playing: ${currentFile.filename}`)
      } catch (error) {
        console.error(`❌ Failed to play ${currentFile.filename}:`, error)
        // Skip to next file
        this.currentIndex++
        if (this.isPlaying && this.currentIndex < this.audioFiles.length) {
          setTimeout(() => {
            if (this.isPlaying) {
              this.playCurrentFile()
            }
          }, 100)
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
      }
    }
  
    stop(): void {
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.src = ''
      }
      
      this.isPlaying = false
      this.isPaused = false
      this.currentIndex = 0
      
      // Clear any message highlighting
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
  
    seek(percentage: number): void {
      if (this.currentAudio && this.currentAudio.duration > 0) {
        this.currentAudio.currentTime = (percentage / 100) * this.currentAudio.duration
        this.updateState()
      }
    }
  
    setVolume(volume: number): void {
      if (this.currentAudio) {
        this.currentAudio.volume = Math.max(0, Math.min(1, volume))
      }
    }
  
    getState(): AudioPlayerState {
      const currentFile = this.audioFiles[this.currentIndex]
      return {
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentIndex: this.currentIndex,
        currentMessageIndex: currentFile?.messageIndex ?? -1,
        totalFiles: this.audioFiles.length,
        currentAgent: currentFile?.agent ?? null,
        progress: this.currentAudio && this.currentAudio.duration > 0 
          ? (this.currentAudio.currentTime / this.currentAudio.duration) * 100 
          : 0,
        currentTime: this.currentAudio?.currentTime ?? 0,
        duration: this.currentAudio?.duration ?? 0
      }
    }
  
    destroy(): void {
      this.stop()
      this.audioFiles = []
      this.currentAudio = null
    }
  }