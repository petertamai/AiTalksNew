// types/index.ts
// Enhanced types for premium AI conversation system 2025

export interface AIAgent {
    id: 'ai1' | 'ai2'
    name: string
    model: string
    prompt: string
    maxTokens: number
    temperature: number
    tts: {
      enabled: boolean
      voice: VoiceOption
    }
  }
  
  export interface ConversationMessage {
    id: string
    role: 'system' | 'human' | 'assistant'
    content: string
    timestamp: string
    agent?: 'ai1' | 'ai2'
    model?: string
    metadata?: {
      processingTime?: number
      tokenUsage?: {
        prompt: number
        completion: number
        total: number
      }
      confidence?: number
    }
  }
  
  export interface ConversationData {
    id: string
    settings: {
      messageDirection: ConversationDirection
      models: {
        ai1: string
        ai2: string
      }
      names: {
        ai1: string
        ai2: string
      }
      prompts: {
        ai1: string
        ai2: string
      }
      tts: {
        ai1: {
          enabled: boolean
          voice: VoiceOption
        }
        ai2: {
          enabled: boolean
          voice: VoiceOption
        }
      }
      parameters: {
        ai1: {
          maxTokens: number
          temperature: number
        }
        ai2: {
          maxTokens: number
          temperature: number
        }
      }
    }
    messages: ConversationMessage[]
    created_at: string
    shared?: boolean
    shared_at?: string
    expires_at?: string
    analytics?: {
      totalMessages: number
      averageResponseTime: number
      totalTokensUsed: number
      conversationDuration: number
    }
  }
  
  export interface SharedConversation {
    conversation_id: string
    shared_at: string
    expires_at: string
    has_audio: boolean
    title: string
    thumbnail?: string
    viewCount?: number
  }
  
  export interface OpenRouterModel {
    id: string
    name?: string
    description?: string
    context_length?: number
    architecture?: {
      modality?: string
      tokenizer?: string
      instruct_type?: string
    }
    pricing?: {
      prompt: string
      completion: string
      image?: string
      request?: string
    }
    top_provider?: {
      max_completion_tokens?: number
      is_moderated?: boolean
    }
    per_request_limits?: {
      prompt_tokens?: string
      completion_tokens?: string
    }
  }
  
  export interface OpenRouterResponse {
    id?: string
    choices: Array<{
      message: {
        content: string
        role: string
      }
      finish_reason: string
      index?: number
    }>
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    model?: string
    created?: number
  }
  
  export interface GroqTTSRequest {
    voice: VoiceOption
    input: string
    conversation_id?: string
    message_index?: number
    agent?: string
    speed?: number
    response_format?: 'mp3' | 'wav' | 'flac'
  }
  
  export interface GroqSTTRequest {
    audio: File
    model?: string
    language?: string
    response_format?: 'json' | 'text' | 'verbose_json'
    temperature?: number
  }
  
  export interface GroqSTTResponse {
    text: string
    segments?: Array<{
      id: number
      seek: number
      start: number
      end: number
      text: string
      tokens: number[]
      temperature: number
      avg_logprob: number
      compression_ratio: number
      no_speech_prob: number
    }>
    language?: string
  }
  
  export interface ConversationState {
    isActive: boolean
    currentAI: 'ai1' | 'ai2' | null
    messages: ConversationMessage[]
    typingIndicator: {
      ai1: boolean
      ai2: boolean
    }
    speakingState: {
      ai1: boolean
      ai2: boolean
    }
    error?: string
    lastActivity?: string
  }
  
  export type ConversationDirection = 
    | 'human-to-ai1' 
    | 'ai1-to-ai2' 
    | 'human-to-ai2' 
    | 'ai2-to-ai1'
  
  // Updated with actual Groq-supported voices (27 voices total)
  export type VoiceOption = 
    | 'Aaliyah-PlayAI'
    | 'Adelaide-PlayAI' 
    | 'Angelo-PlayAI'
    | 'Arista-PlayAI'
    | 'Atlas-PlayAI'
    | 'Basil-PlayAI'
    | 'Briggs-PlayAI'
    | 'Calum-PlayAI'
    | 'Celeste-PlayAI'
    | 'Cheyenne-PlayAI'
    | 'Chip-PlayAI'
    | 'Cillian-PlayAI'
    | 'Deedee-PlayAI'
    | 'Eleanor-PlayAI'
    | 'Fritz-PlayAI'
    | 'Gail-PlayAI'
    | 'Indigo-PlayAI'
    | 'Jennifer-PlayAI'
    | 'Judy-PlayAI'
    | 'Mamaw-PlayAI'
    | 'Mason-PlayAI'
    | 'Mikail-PlayAI'
    | 'Mitch-PlayAI'
    | 'Nia-PlayAI'
    | 'Quinn-PlayAI'
    | 'Ruby-PlayAI'
    | 'Thunder-PlayAI'
  
  export interface AudioPlaybackState {
    isPlaying: boolean
    isPaused: boolean
    currentIndex: number
    audioFiles: AudioFileInfo[]
    conversationId: string
    progress: number
    currentTime: number
    duration: number
  }
  
  export interface AudioFileInfo {
    filename: string
    messageIndex: number
    agent: 'ai1' | 'ai2'
    duration?: number
    size?: number
    url?: string
  }
  
  export interface APIKeyStatus {
    saved: boolean
    valid: boolean
    lastValidated?: string
    error?: string
  }
  
  export interface APIConfiguration {
    openrouter: {
      key: string
      status: APIKeyStatus
      models?: OpenRouterModel[]
      lastFetch?: string
    }
    groq: {
      key: string
      status: APIKeyStatus
      features?: {
        tts: boolean
        stt: boolean
      }
    }
  }
  
  export interface ConversationAnalytics {
    messageCount: number
    participantCounts: {
      ai1: number
      ai2: number
      human: number
      system: number
    }
    averageMessageLength: number
    conversationDuration: number
    responseTimeStats: {
      average: number
      min: number
      max: number
      median: number
    }
    tokenUsage?: {
      total: number
      byAgent: {
        ai1: number
        ai2: number
      }
      estimatedCost: number
    }
    sentiment?: {
      overall: 'positive' | 'neutral' | 'negative'
      score: number
      confidence: number
    }
  }
  
  export interface UserPreferences {
    theme: 'light' | 'dark' | 'system'
    autoPlay: boolean
    notifications: boolean
    debugMode: boolean
    experimentalFeatures: boolean
    defaultModels: {
      ai1: string
      ai2: string
    }
    defaultVoices: {
      ai1: VoiceOption
      ai2: VoiceOption
    }
  }
  
  export interface ShareOptions {
    includeAudio: boolean
    expirationDays: number
    requirePassword: boolean
    password?: string
    allowComments: boolean
    showAnalytics: boolean
  }
  
  export interface ConversationExport {
    format: 'json' | 'markdown' | 'html' | 'pdf'
    includeMetadata: boolean
    includeAudio: boolean
    includeTimestamps: boolean
    theme: 'light' | 'dark'
    customStyling?: string
  }
  
  // Error types
  export interface APIError {
    code: string
    message: string
    details?: any
    timestamp: string
    retryable: boolean
  }
  
  export interface ValidationError {
    field: string
    message: string
    code: string
  }
  
  // Event types for real-time updates
  export interface ConversationEvent {
    type: 'message' | 'typing' | 'speaking' | 'error' | 'status'
    data: any
    timestamp: string
    source: 'ai1' | 'ai2' | 'human' | 'system'
  }
  
  // Premium feature flags
  export interface FeatureFlags {
    advancedAnalytics: boolean
    customVoices: boolean
    realtimeCollaboration: boolean
    conversationBranching: boolean
    aiPersonalities: boolean
    exportOptions: boolean
    apiIntegrations: boolean
  }
  
  // Component prop types
  export interface BaseComponentProps {
    className?: string
    disabled?: boolean
    loading?: boolean
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
  }
  
  export interface ConversationComponentProps extends BaseComponentProps {
    conversationId: string
    isSharedView?: boolean
    readOnly?: boolean
  }
  
  export interface AgentComponentProps extends BaseComponentProps {
    agent: AIAgent
    onAgentChange: (updates: Partial<AIAgent>) => void
  }
  
  // Utility types
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
  }
  
  export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
  
  export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
  
  // API response wrapper
  export interface APIResponse<T = any> {
    success: boolean
    data?: T
    error?: APIError
    metadata?: {
      timestamp: string
      requestId: string
      processingTime: number
    }
  }
  
  // Pagination types
  export interface PaginationParams {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filter?: Record<string, any>
  }
  
  export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  
  // Search and filtering
  export interface SearchParams {
    query: string
    filters: {
      dateRange?: {
        start: string
        end: string
      }
      agents?: ('ai1' | 'ai2' | 'human')[]
      models?: string[]
      hasAudio?: boolean
      shared?: boolean
    }
    sortBy: 'created_at' | 'updated_at' | 'message_count' | 'duration'
    sortOrder: 'asc' | 'desc'
  }
  
  export default {}