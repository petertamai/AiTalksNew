// app/api/openrouter/chat/route.ts
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
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in OpenRouter chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
