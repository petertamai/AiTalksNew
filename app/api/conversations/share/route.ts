// app/api/conversations/share/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, data } = body

    // For now, just return a mock share URL
    // In production, you'd save this to a database
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${conversation_id}`

    return NextResponse.json({
      success: true,
      shareUrl,
      conversation_id
    })

  } catch (error) {
    console.error('Error sharing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to share conversation' },
      { status: 500 }
    )
  }
}
