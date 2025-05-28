// app/api/openrouter/models/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const apiKey = cookieStore.get('openrouter_api_key')?.value

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not found' },
        { status: 401 }
      )
    }

    console.log('Fetching models from OpenRouter...')

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Conversation System'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`Received ${data.data?.length || 0} models from OpenRouter`)
    
    // Filter out models without proper data and sort
    const filteredModels = data.data
      ?.filter((model: any) => 
        model.id && 
        model.id.length > 0 && 
        !model.id.includes('free') && 
        model.context_length > 0
      )
      ?.sort((a: any, b: any) => a.id.localeCompare(b.id))

    console.log(`Filtered to ${filteredModels?.length || 0} valid models`)

    return NextResponse.json({
      success: true,
      data: filteredModels || [],
      total: filteredModels?.length || 0
    })

  } catch (error) {
    console.error('Error fetching OpenRouter models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
