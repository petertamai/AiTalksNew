// app/share/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ConversationData } from '@/types'
import PremiumSharedConversationView from '@/app/share/[id]/SharedConversationView'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  AlertCircle, 
  Share2, 
  Home, 
  RefreshCcw,
  Clock,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface SharedPageProps {
  params: {
    id: string
  }
}

export default function SharedConversationPage() {
  const params = useParams()
  const conversationId = params?.id as string
  
  const [conversationData, setConversationData] = useState<ConversationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAudio, setHasAudio] = useState(false)

  const loadSharedConversation = async () => {
    if (!conversationId) {
      setError('Invalid conversation ID')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    console.log('📥 Loading shared conversation:', conversationId)

    try {
      const response = await fetch(`/api/conversations/share?conversation_id=${conversationId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shared conversation not found. It may have been deleted or the link is invalid.')
        } else if (response.status === 410) {
          throw new Error('This shared conversation has expired.')
        } else {
          throw new Error(`Failed to load conversation (${response.status})`)
        }
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Shared conversation loaded:', {
          messageCount: result.data.messages?.length || 0,
          hasAudio: result.data.has_audio,
          sharedAt: result.data.shared_at
        })
        
        setConversationData(result.data)
        setHasAudio(result.data.has_audio || false)
        
        // Show success toast
        toast.success('Conversation Loaded', {
          description: `Loaded ${result.data.messages?.length || 0} messages`,
          duration: 3000
        })
      } else {
        throw new Error(result.error || 'Failed to load conversation data')
      }
    } catch (error) {
      console.error('❌ Error loading shared conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      
      toast.error('Loading Failed', {
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSharedConversation()
  }, [conversationId])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleRetry = () => {
    loadSharedConversation()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Loading Shared Conversation</h3>
              <p className="text-sm text-muted-foreground">
                Fetching conversation data...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Failed to Load Conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {error}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share Link
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href="/">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </a>
                </Button>
              </div>
            </div>

            {/* Help text */}
            <div className="text-xs text-muted-foreground text-center max-w-sm">
              <p>If this link was shared with you, please verify it's correct or ask for a new one.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - render the shared conversation
  if (conversationData) {
    return (
      <>
        <PremiumSharedConversationView
          conversationData={conversationData}
          conversationId={conversationId}
          hasAudio={hasAudio}
        />
        
        {/* Metadata for social sharing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Conversation',
              name: `AI Conversation - ${conversationData.messages?.length || 0} messages`,
              description: 'Shared AI conversation from AI Conversation System',
              dateCreated: conversationData.created_at,
              datePublished: conversationData.shared_at,
              url: window.location.href,
              author: {
                '@type': 'Organization',
                name: 'AI Conversation System'
              }
            })
          }}
        />
      </>
    )
  }

  // Fallback (should never reach here)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load the shared conversation.
            </p>
          </div>
          <Button onClick={handleRetry}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}