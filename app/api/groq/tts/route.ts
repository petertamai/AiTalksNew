// app/api/groq/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const apiKey = cookieStore.get('groq_api_key')?.value

    if (!apiKey) {
      console.log('❌ Groq API key not found, falling back to mock audio')
      return generateMockAudio()
    }

    const { voice, input, conversation_id, message_index } = await request.json()

    console.log('🎵 Groq TTS Request:', {
      voice,
      inputLength: input?.length || 0,
      conversation_id,
      message_index,
      hasApiKey: !!apiKey
    })

    // Try Groq TTS API first
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'playai-tts', // Correct Groq TTS model name
          input: input.slice(0, 4096), // Groq has input limits
          voice: voice, // Use original PlayAI voice names directly
          response_format: 'mp3',
          speed: 1.0
        }),
      })

      if (groqResponse.ok) {
        console.log('✅ Groq TTS successful')
        const audioBuffer = await groqResponse.arrayBuffer()
        
        // Optionally save audio file for later playback
        if (conversation_id && message_index !== undefined) {
          saveAudioFile(audioBuffer, conversation_id, message_index, voice).catch((error) => {
            console.log('⚠️ Failed to save audio file (non-critical):', error)
          })
        }
        
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600'
          }
        })
      } else {
        const errorText = await groqResponse.text()
        console.log('❌ Groq TTS failed:', groqResponse.status, errorText)
        throw new Error(`Groq TTS failed: ${groqResponse.status}`)
      }
    } catch (groqError) {
      console.log('⚠️ Groq TTS error, falling back to mock:', groqError)
      return generateMockAudio()
    }

  } catch (error) {
    console.error('❌ Error in Groq TTS route:', error)
    return generateMockAudio()
  }
}

async function saveAudioFile(
  audioBuffer: ArrayBuffer, 
  conversationId: string, 
  messageIndex: number,
  voice: string
): Promise<void> {
  try {
    // Create directory structure
    const audioDir = path.join(process.cwd(), 'public', 'conversations', conversationId, 'audio')
    await fs.mkdir(audioDir, { recursive: true })

    // Save audio file
    const filename = `message_${messageIndex}.mp3`
    const filepath = path.join(audioDir, filename)
    
    await fs.writeFile(filepath, Buffer.from(audioBuffer))
    
    console.log('💾 Audio file saved:', { filename, size: audioBuffer.byteLength })
  } catch (error) {
    console.error('❌ Error saving audio file:', error)
    throw error
  }
}

function generateMockAudio(): NextResponse {
  console.log('🎭 Generating mock audio (TTS not available)')
  
  // Generate a simple beep tone as mock audio
  const sampleRate = 44100
  const duration = 1 // 1 second
  const frequency = 440 // A note
  const samples = sampleRate * duration
  
  // Create a simple WAV file buffer
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples * 2, true)
  
  // Generate sine wave
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1 // Low volume
    view.setInt16(44 + i * 2, sample * 0x7FFF, true)
  }
  
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.byteLength.toString(),
      'Cache-Control': 'no-cache'
    }
  })
}