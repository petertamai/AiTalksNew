// hooks/useConversationManager.ts - WORKING VERSION: Keep it simple
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useConversation } from '@/contexts/ConversationContext'
import { AIAgent, ConversationDirection, ConversationMessage } from '@/types'
import { debugLog } from '@/lib/utils'
import { toast } from 'sonner'

interface UseConversationManagerReturn {
  isActive: boolean
  currentTurn: 'ai1' | 'ai2' | null
  turnCount: number
  startConversation: (direction: ConversationDirection, message: string) => Promise<void>
  stopConversation: () => void
}

export function useConversationManager(
  ai1Config: AIAgent,
  ai2Config: AIAgent,
  maxTurns = 20,
  turnDelay = 3000
): UseConversationManagerReturn {
  const conversation = useConversation()
  const [currentTurn, setCurrentTurn] = useState<'ai1' | 'ai2' | null>(null)
  const [turnCount, setTurnCount] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  // Get agent config
  const getAgentConfig = useCallback((agent: 'ai1' | 'ai2'): AIAgent => {
    return agent === 'ai1' ? ai1Config : ai2Config
  }, [ai1Config, ai2Config])

  // FIXED: Build conversation context - NO NAMES, NO DUPLICATES
  const buildContext = useCallback((forAgent: 'ai1' | 'ai2'): any[] => {
    const messages = conversation.state.messages
    const contextMessages: any[] = []
    
    debugLog(`🧠 Building context for ${forAgent} from ${messages.length} messages`)
    
    messages.forEach((msg, index) => {
      if (msg.role === 'assistant' && msg.agent) {
        if (msg.agent === forAgent) {
          // Own messages as assistant
          contextMessages.push({
            role: 'assistant',
            content: msg.content
            // NO name field ever!
          })
          debugLog(`🤖 Added own message [${index}] for ${forAgent}`)
        } else {
          // Other agent's messages as user messages (NO NAME!)
          contextMessages.push({
            role: 'user',
            content: msg.content
            // NO name field! More natural conversation
          })
          debugLog(`👥 Added other agent message [${index}] from ${msg.agent} as user`)
        }
      }
    })
    
    debugLog(`🧠 Final context for ${forAgent}: ${contextMessages.length} messages`)
    debugLog(`📋 Context:`, contextMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`))
    
    return contextMessages
  }, [conversation.state.messages, getAgentConfig])

  // Generate response for an agent
  const generateResponse = useCallback(async (agent: 'ai1' | 'ai2'): Promise<string> => {
    const agentConfig = getAgentConfig(agent)
    const otherAgent = agent === 'ai1' ? 'ai2' : 'ai1'
    const otherConfig = getAgentConfig(otherAgent)
    
    debugLog(`🎯 Generating response for ${agent} (${agentConfig.name})`)
    
    try {
      // Set typing indicator
      conversation.setTypingIndicator(agent, true)
      
      // Build context
      const contextMessages = buildContext(agent)
      
      // System prompt
      const systemPrompt = `You are ${agentConfig.name}, engaging in a conversation with another AI assistant called ${otherConfig.name}. 

${agentConfig.prompt}

Keep your responses natural, thoughtful, and conversational. Build upon the conversation history and respond directly to what was just said. Avoid repeating information already covered unless it adds new insight.`

      // API request
      const requestBody = {
        model: agentConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages
        ],
        max_tokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature
      }
      
      debugLog(`🚀 API Request for ${agent}:`, { model: agentConfig.model, messages: contextMessages.length })

      const response = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response')
      }

      const responseContent = data.choices[0].message.content.trim()
      debugLog(`✅ Response generated for ${agent}: ${responseContent.length} chars`)
      
      return responseContent
      
    } catch (error) {
      debugLog(`❌ Error generating response for ${agent}:`, error)
      throw error
    } finally {
      conversation.setTypingIndicator(agent, false)
    }
  }, [conversation, getAgentConfig, buildContext])

  // Handle TTS
  const handleTTS = useCallback(async (agent: 'ai1' | 'ai2', text: string) => {
    const agentConfig = getAgentConfig(agent)
    
    if (!agentConfig.tts.enabled) return

    try {
      debugLog(`🎵 Starting TTS for ${agent}`)
      conversation.setSpeakingState(agent, true)

      const response = await fetch('/api/groq/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: agentConfig.tts.voice,
          input: text,
          conversation_id: 'current',
          message_index: conversation.state.messages.length
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          conversation.setSpeakingState(agent, false)
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.onerror = () => {
          conversation.setSpeakingState(agent, false)
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
      }
    } catch (error) {
      debugLog(`❌ TTS error for ${agent}:`, error)
      conversation.setSpeakingState(agent, false)
    }
  }, [conversation, getAgentConfig])

  // Execute a turn
  const executeTurn = useCallback(async (agent: 'ai1' | 'ai2') => {
    try {
      const agentConfig = getAgentConfig(agent)
      debugLog(`🎬 Executing turn for ${agent} (${agentConfig.name})`)
      
      setCurrentTurn(agent)

      // Generate response
      const response = await generateResponse(agent)
      
      // Add message
      const message: Omit<ConversationMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: response,
        agent: agent,
        model: agentConfig.model
      }
      
      conversation.addMessage(message)
      setTurnCount(prev => prev + 1)

      // Handle TTS
      await handleTTS(agent, response)
      
      setCurrentTurn(null)
      debugLog(`✅ Turn completed for ${agent}`)
      
      return response
      
    } catch (error) {
      debugLog(`❌ Turn failed for ${agent}:`, error)
      setCurrentTurn(null)
      throw error
    }
  }, [conversation, generateResponse, handleTTS, getAgentConfig])

  // Schedule next turn
  const scheduleNextTurn = useCallback((nextAgent: 'ai1' | 'ai2') => {
    if (!conversation.state.isActive) {
      debugLog('❌ Conversation not active, stopping turns')
      return
    }
    
    if (turnCount >= maxTurns) {
      debugLog('🏁 Max turns reached')
      stopConversation()
      return
    }
    
    debugLog(`⏰ Scheduling ${nextAgent} in ${turnDelay}ms`)
    
    timeoutRef.current = setTimeout(async () => {
      if (conversation.state.isActive) {
        try {
          await executeTurn(nextAgent)
          // Schedule opposite agent
          const oppositeAgent = nextAgent === 'ai1' ? 'ai2' : 'ai1'
          scheduleNextTurn(oppositeAgent)
        } catch (error) {
          debugLog('❌ Turn execution failed:', error)
          stopConversation()
        }
      }
    }, turnDelay)
  }, [conversation.state.isActive, turnCount, maxTurns, turnDelay, executeTurn])

  // Start conversation
  const startConversation = useCallback(async (direction: ConversationDirection, message: string) => {
    try {
      debugLog('🎬 Starting conversation:', { direction, message: message.substring(0, 50) })
      
      // Reset state
      setCurrentTurn(null)
      setTurnCount(0)
      
      // Clear timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      
      // Create abort controller
      abortControllerRef.current = new AbortController()
      
      // Start conversation in context
      conversation.startConversation()
      
      // FIXED: Add starter message attributed to first AI based on direction
      const starterAgent = direction === 'ai1-to-ai2' ? 'ai1' : 'ai2'
      const responderAgent = direction === 'ai1-to-ai2' ? 'ai2' : 'ai1'
      
      const starterConfig = getAgentConfig(starterAgent)
      
      // Add starter message attributed to the starter agent
      conversation.addMessage({
        role: 'assistant',
        content: message.trim(),
        agent: starterAgent, // Key fix: attribute to first AI
        model: starterConfig.model
      })
      
      setTurnCount(1)
      debugLog(`📝 Starter attributed to ${starterAgent} (${starterConfig.name})`)
      
      // Schedule the responder to respond
      scheduleNextTurn(responderAgent)
      
    } catch (error) {
      debugLog('❌ Failed to start conversation:', error)
      conversation.stopConversation('Failed to start')
      throw error
    }
  }, [conversation, getAgentConfig, scheduleNextTurn])

  // Stop conversation
  const stopConversation = useCallback(() => {
    debugLog('🛑 Stopping conversation')
    
    // Clear timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    // Abort requests
    if (abortControllerRef.current) abortControllerRef.current.abort()
    
    // Reset state
    setCurrentTurn(null)
    setTurnCount(0)
    
    // Stop in context
    conversation.stopConversation()
  }, [conversation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  return {
    isActive: conversation.state.isActive,
    currentTurn,
    turnCount,
    startConversation,
    stopConversation
  }
}