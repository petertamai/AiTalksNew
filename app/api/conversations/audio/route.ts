// app/api/conversations/audio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking for audio files for conversation:', conversationId)

    // Check if we're in development or production
    const isDev = process.env.NODE_ENV === 'development'
    
    // In development, audio files would be in public/conversations
    // In production, they might be in a different location or external storage
    const audioDir = path.join(process.cwd(), 'public', 'conversations', conversationId, 'audio')
    
    console.log('📁 Checking audio directory:', audioDir)

    let audioFiles: string[] = []

    try {
      // Check if directory exists
      await fs.access(audioDir)
      
      // Read directory contents
      const files = await fs.readdir(audioDir)
      
      // Filter for audio files
      audioFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.wav') || 
        file.endsWith('.ogg')
      ).sort((a, b) => {
        // Sort by message index
        const aMatch = a.match(/message_(\d+)/)
        const bMatch = b.match(/message_(\d+)/)
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1])
        }
        
        return a.localeCompare(b)
      })
      
      console.log('🎵 Found audio files:', audioFiles)
      
    } catch (dirError) {
      console.log('📁 Audio directory not found or empty:', dirError)
      // Directory doesn't exist or is empty - this is normal for conversations without saved audio
    }

    // Always return success, even if no files found
    return NextResponse.json({
      success: true,
      audioFiles,
      conversation_id: conversationId,
      total: audioFiles.length,
      directory: audioDir,
      note: audioFiles.length === 0 ? 'No saved audio files found. Audio is generated in real-time during conversations.' : undefined
    })

  } catch (error) {
    console.error('❌ Error fetching audio files:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch audio files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to save audio during conversations (if needed)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const messageIndex = searchParams.get('message_index')
    const agent = searchParams.get('agent')

    if (!conversationId || messageIndex === null || !agent) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversation_id, message_index, agent' },
        { status: 400 }
      )
    }

    console.log('💾 Saving audio file:', { conversationId, messageIndex, agent })

    // Get audio data from request body
    const audioBuffer = await request.arrayBuffer()
    
    if (audioBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      )
    }

    // Create directory structure
    const audioDir = path.join(process.cwd(), 'public', 'conversations', conversationId, 'audio')
    await fs.mkdir(audioDir, { recursive: true })

    // Save audio file
    const filename = `message_${messageIndex}_${agent}.mp3`
    const filepath = path.join(audioDir, filename)
    
    await fs.writeFile(filepath, Buffer.from(audioBuffer))
    
    console.log('✅ Audio file saved:', filepath)

    return NextResponse.json({
      success: true,
      filename,
      filepath: filepath,
      size: audioBuffer.byteLength,
      message: 'Audio file saved successfully'
    })

  } catch (error) {
    console.error('❌ Error saving audio file:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save audio file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}