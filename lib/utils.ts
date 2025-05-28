import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

export default {
  debugLog,
  cn,
  generateId,
  formatTimestamp,
  calculateSpeakingTime,
  safeJsonParse,
  debounce,
  throttle,
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
