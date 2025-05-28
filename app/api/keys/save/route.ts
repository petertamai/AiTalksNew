// app/api/keys/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { openrouter_api_key, groq_api_key } = body

    const cookieStore = cookies()

    // Save OpenRouter API key
    if (openrouter_api_key !== undefined) {
      if (openrouter_api_key && openrouter_api_key.trim()) {
        cookieStore.set('openrouter_api_key', openrouter_api_key.trim(), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 // 30 days
        })
      } else {
        cookieStore.delete('openrouter_api_key')
      }
    }

    // Save Groq API key
    if (groq_api_key !== undefined) {
      if (groq_api_key && groq_api_key.trim()) {
        cookieStore.set('groq_api_key', groq_api_key.trim(), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 // 30 days
        })
      } else {
        cookieStore.delete('groq_api_key')
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'API keys saved successfully'
    })

  } catch (error) {
    console.error('Error saving API keys:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save API keys' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    
    const openrouterKey = cookieStore.get('openrouter_api_key')?.value || ''
    const groqKey = cookieStore.get('groq_api_key')?.value || ''

    return NextResponse.json({
      success: true,
      data: {
        openrouter_api_key: openrouterKey,
        groq_api_key: groqKey
      }
    })

  } catch (error) {
    console.error('Error getting API keys:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get API keys' 
      },
      { status: 500 }
    )
  }
}
