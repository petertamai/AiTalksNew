import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AIAgent, ConversationDirection } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export function calculateSpeakingTime(text: string): number {
  const words = text.split(/\s+/).filter(word => word.length > 0)
  const wordCount = words.length
  
  const baseWordsPerMinute = 150
  const complexityFactor = Math.min(1.3, 1 + (wordCount / 200))
  const pauseFactor = (text.match(/[.!?]/g) || []).length * 500
  
  const baseTime = (wordCount / baseWordsPerMinute) * 60 * 1000 * complexityFactor
  const totalTime = baseTime + pauseFactor
  
  return Math.max(2000, Math.min(totalTime, 30000))
}

export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed !== null ? parsed : fallback
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return fallback
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data)
    } else {
      console.log(`[DEBUG] ${message}`)
    }
  }
}

// ========== LOCAL STORAGE UTILITIES ==========

export interface ConversationSettings {
  ai1Config: AIAgent
  ai2Config: AIAgent
  startingMessage: string
  conversationDirection: ConversationDirection
  lastUpdated: string
  version: string
}

const STORAGE_KEYS = {
  CONVERSATION_SETTINGS: 'ai_conversation_settings',
  AI1_CONFIG: 'ai1_config',
  AI2_CONFIG: 'ai2_config',
  STARTING_MESSAGE: 'starting_message',
  CONVERSATION_DIRECTION: 'conversation_direction',
  USER_PREFERENCES: 'user_preferences'
} as const

// Default configurations
export const DEFAULT_AI1_CONFIG: AIAgent = {
  id: 'ai1',
  name: 'Genesis',
  model: '',
  prompt: "You are Genesis, you are yourself.",
  maxTokens: 1500,
  temperature: 0.7,
  tts: {
    enabled: true,
    voice: 'Arista-PlayAI',
  },
}

export const DEFAULT_AI2_CONFIG: AIAgent = {
  id: 'ai2',
  name: 'Synthesis',
  model: '',
  prompt: "You are Synthesis, you are yourself.",
  maxTokens: 1500,
  temperature: 0.6,
  tts: {
    enabled: true,
    voice: 'Angelo-PlayAI',
  },
}

export const DEFAULT_STARTING_MESSAGE = "Hello!"
export const DEFAULT_CONVERSATION_DIRECTION: ConversationDirection = 'ai1-to-ai2'

// Safe localStorage operations (client-side only)
export function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null
  } catch {
    return false
  }
}

export function getFromLocalStorage<T>(key: string, fallback: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, using fallback')
    return fallback
  }

  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      console.log(`🔍 No stored value found for key: ${key}, using fallback`)
      return fallback
    }
    
    const parsed = JSON.parse(item)
    console.log(`✅ Loaded from localStorage [${key}]:`, parsed)
    return parsed
  } catch (error) {
    console.error(`❌ Error reading from localStorage [${key}]:`, error)
    return fallback
  }
}

export function saveToLocalStorage<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot save')
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    console.log(`💾 Saved to localStorage [${key}]:`, value)
    return true
  } catch (error) {
    console.error(`❌ Error saving to localStorage [${key}]:`, error)
    return false
  }
}

export function removeFromLocalStorage(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot remove')
    return false
  }

  try {
    localStorage.removeItem(key)
    console.log(`🗑️ Removed from localStorage: ${key}`)
    return true
  } catch (error) {
    console.error(`❌ Error removing from localStorage [${key}]:`, error)
    return false
  }
}

// ========== CONVERSATION SETTINGS OPERATIONS ==========

export function loadConversationSettings(): {
  ai1Config: AIAgent
  ai2Config: AIAgent
  startingMessage: string
  conversationDirection: ConversationDirection
} {
  console.log('🔄 Loading conversation settings from localStorage...')
  
  const ai1Config = getFromLocalStorage(STORAGE_KEYS.AI1_CONFIG, DEFAULT_AI1_CONFIG)
  const ai2Config = getFromLocalStorage(STORAGE_KEYS.AI2_CONFIG, DEFAULT_AI2_CONFIG)
  const startingMessage = getFromLocalStorage(STORAGE_KEYS.STARTING_MESSAGE, DEFAULT_STARTING_MESSAGE)
  const conversationDirection = getFromLocalStorage(STORAGE_KEYS.CONVERSATION_DIRECTION, DEFAULT_CONVERSATION_DIRECTION)

  // Validate and fix any missing or invalid properties
  const validatedAI1 = validateAIConfig(ai1Config, DEFAULT_AI1_CONFIG)
  const validatedAI2 = validateAIConfig(ai2Config, DEFAULT_AI2_CONFIG)

  console.log('✅ Conversation settings loaded:', {
    ai1Name: validatedAI1.name,
    ai1Model: validatedAI1.model || 'Not selected',
    ai2Name: validatedAI2.name,
    ai2Model: validatedAI2.model || 'Not selected',
    startingMessage: startingMessage.substring(0, 50) + '...',
    direction: conversationDirection
  })

  return {
    ai1Config: validatedAI1,
    ai2Config: validatedAI2,
    startingMessage,
    conversationDirection
  }
}

export function saveConversationSettings(settings: {
  ai1Config?: Partial<AIAgent>
  ai2Config?: Partial<AIAgent>
  startingMessage?: string
  conversationDirection?: ConversationDirection
}): boolean {
  console.log('💾 Saving conversation settings to localStorage...', settings)
  
  let allSaved = true

  if (settings.ai1Config) {
    const success = saveToLocalStorage(STORAGE_KEYS.AI1_CONFIG, settings.ai1Config)
    allSaved = allSaved && success
  }

  if (settings.ai2Config) {
    const success = saveToLocalStorage(STORAGE_KEYS.AI2_CONFIG, settings.ai2Config)
    allSaved = allSaved && success
  }

  if (settings.startingMessage !== undefined) {
    const success = saveToLocalStorage(STORAGE_KEYS.STARTING_MESSAGE, settings.startingMessage)
    allSaved = allSaved && success
  }

  if (settings.conversationDirection) {
    const success = saveToLocalStorage(STORAGE_KEYS.CONVERSATION_DIRECTION, settings.conversationDirection)
    allSaved = allSaved && success
  }

  console.log(allSaved ? '✅ All settings saved successfully' : '⚠️ Some settings failed to save')
  return allSaved
}

export function validateAIConfig(config: Partial<AIAgent>, defaultConfig: AIAgent): AIAgent {
  return {
    id: config.id || defaultConfig.id,
    name: config.name || defaultConfig.name,
    model: config.model || defaultConfig.model,
    prompt: config.prompt || defaultConfig.prompt,
    maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : defaultConfig.maxTokens,
    temperature: typeof config.temperature === 'number' ? config.temperature : defaultConfig.temperature,
    tts: {
      enabled: typeof config.tts?.enabled === 'boolean' ? config.tts.enabled : defaultConfig.tts.enabled,
      voice: config.tts?.voice || defaultConfig.tts.voice,
    },
  }
}

export function resetConversationSettings(): boolean {
  console.log('🔄 Resetting conversation settings to defaults...')
  
  const success = saveConversationSettings({
    ai1Config: DEFAULT_AI1_CONFIG,
    ai2Config: DEFAULT_AI2_CONFIG,
    startingMessage: DEFAULT_STARTING_MESSAGE,
    conversationDirection: DEFAULT_CONVERSATION_DIRECTION
  })

  if (success) {
    console.log('✅ Conversation settings reset to defaults')
  } else {
    console.error('❌ Failed to reset conversation settings')
  }

  return success
}

export function exportConversationSettings(): string {
  const settings = loadConversationSettings()
  const exportData = {
    ...settings,
    exportedAt: new Date().toISOString(),
    version: '2.0.0'
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function importConversationSettings(jsonString: string): boolean {
  try {
    const importData = JSON.parse(jsonString)
    
    const settings = {
      ai1Config: importData.ai1Config,
      ai2Config: importData.ai2Config,
      startingMessage: importData.startingMessage,
      conversationDirection: importData.conversationDirection
    }
    
    return saveConversationSettings(settings)
  } catch (error) {
    console.error('❌ Failed to import conversation settings:', error)
    return false
  }
}

// ========== DEBOUNCED SAVE FUNCTIONS ==========

export const debouncedSaveAI1Config = debounce((config: Partial<AIAgent>) => {
  saveConversationSettings({ ai1Config: config })
}, 1000)

export const debouncedSaveAI2Config = debounce((config: Partial<AIAgent>) => {
  saveConversationSettings({ ai2Config: config })
}, 1000)

export const debouncedSaveStartingMessage = debounce((message: string) => {
  saveConversationSettings({ startingMessage: message })
}, 1500)

export default {
  debugLog,
  cn,
  generateId,
  formatTimestamp,
  calculateSpeakingTime,
  safeJsonParse,
  debounce,
  throttle,
  // localStorage utilities
  isLocalStorageAvailable,
  getFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  // Conversation settings
  loadConversationSettings,
  saveConversationSettings,
  validateAIConfig,
  resetConversationSettings,
  exportConversationSettings,
  importConversationSettings,
  // Debounced functions
  debouncedSaveAI1Config,
  debouncedSaveAI2Config,
  debouncedSaveStartingMessage,
  // Constants
  DEFAULT_AI1_CONFIG,
  DEFAULT_AI2_CONFIG,
  DEFAULT_STARTING_MESSAGE,
  DEFAULT_CONVERSATION_DIRECTION
}