// app/api/conversations/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, data } = body

    if (!conversation_id || !data) {
      return NextResponse.json(
        { error: 'Missing conversation_id or data' },
        { status: 400 }
      )
    }

    console.log('📤 Sharing conversation:', conversation_id)

    // Create shared conversations directory
    const sharedDir = path.join(process.cwd(), 'public', 'shared-conversations')
    await fs.mkdir(sharedDir, { recursive: true })

    // Add sharing metadata
    const sharedData = {
      ...data,
      shared: true,
      shared_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      has_audio: false // Will be updated if audio files exist
    }

    // Check if audio files exist for this conversation
    try {
      const audioDir = path.join(process.cwd(), 'public', 'conversations', conversation_id, 'audio')
      const audioFiles = await fs.readdir(audioDir)
      sharedData.has_audio = audioFiles.length > 0
      console.log('🎵 Audio files found:', audioFiles.length)
    } catch (error) {
      console.log('🔇 No audio files found for conversation')
    }

    // Save shared conversation data
    const sharedFilePath = path.join(sharedDir, `${conversation_id}.json`)
    await fs.writeFile(sharedFilePath, JSON.stringify(sharedData, null, 2))

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${conversation_id}`
    
    console.log('✅ Conversation shared successfully:', shareUrl)

    return NextResponse.json({
      success: true,
      shareUrl,
      conversation_id,
      expires_at: sharedData.expires_at,
      has_audio: sharedData.has_audio
    })

  } catch (error) {
    console.error('❌ Error sharing conversation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to share conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversation_id = searchParams.get('conversation_id')

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      )
    }

    console.log('📥 Loading shared conversation:', conversation_id)

    // Load shared conversation data
    const sharedDir = path.join(process.cwd(), 'public', 'shared-conversations')
    const sharedFilePath = path.join(sharedDir, `${conversation_id}.json`)

    try {
      const sharedData = await fs.readFile(sharedFilePath, 'utf8')
      const conversationData = JSON.parse(sharedData)

      // Check if conversation has expired
      if (conversationData.expires_at && new Date() > new Date(conversationData.expires_at)) {
        return NextResponse.json(
          { error: 'Shared conversation has expired' },
          { status: 410 }
        )
      }

      console.log('✅ Shared conversation loaded successfully')

      return NextResponse.json({
        success: true,
        data: conversationData,
        conversation_id
      })

    } catch (fileError) {
      console.log('❌ Shared conversation not found:', conversation_id)
      return NextResponse.json(
        { error: 'Shared conversation not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('❌ Error loading shared conversation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load shared conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}