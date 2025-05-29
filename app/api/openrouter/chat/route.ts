// app/api/openrouter/chat/route.ts - DEBUG VERSION to see what's being sent
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const apiKey = cookieStore.get('openrouter_api_key')?.value

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not found' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 🔍 DEBUG: Log what we're receiving
    console.log('🔍 DEBUG: Received request body:', JSON.stringify(body, null, 2))
    console.log('🔍 DEBUG: Messages array:', body.messages?.map((msg: any, i: number) => ({
      index: i,
      role: msg.role,
      content: msg.content?.substring(0, 50) + '...',
      name: msg.name || 'NO_NAME',
      hasName: !!msg.name
    })))

    // Check for duplicates
    if (body.messages) {
      const duplicates = body.messages.filter((msg: any, index: number, array: any[]) => {
        return array.findIndex((m: any) => 
          m.role === msg.role && 
          m.content === msg.content && 
          m.name === msg.name
        ) !== index
      })
      
      if (duplicates.length > 0) {
        console.log('🚨 DUPLICATES DETECTED:', duplicates.length)
        duplicates.forEach((dup: any, i: number) => {
          console.log(`🚨 Duplicate ${i}:`, {
            role: dup.role,
            content: dup.content?.substring(0, 30) + '...',
            name: dup.name
          })
        })
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Conversation System'
      },
      body: JSON.stringify({
        ...body,
        stream: false // Ensure no streaming for now
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter chat API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // 🔍 DEBUG: Log the response
    console.log('🔍 DEBUG: OpenRouter response:', {
      model: data.model,
      usage: data.usage,
      responseLength: data.choices?.[0]?.message?.content?.length
    })
    
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in OpenRouter chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}