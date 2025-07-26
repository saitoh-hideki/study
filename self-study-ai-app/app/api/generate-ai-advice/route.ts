import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('API route: Sending request to generate-ai-advice with body:', body)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('API route: Environment variables:', { 
      supabaseUrl: !!supabaseUrl, 
      anonKey: !!anonKey 
    })
    
    if (!supabaseUrl || !anonKey) {
      console.error('API route: Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-ai-advice`
    console.log('API route: Calling Edge Function at:', edgeFunctionUrl)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body)
    })

    console.log('API route: Edge Function response status:', response.status)
    console.log('API route: Edge Function response headers:', Object.fromEntries(response.headers.entries()))

    // Check if response body exists
    if (!response.body) {
      console.error('API route: No response body from Edge Function')
      return NextResponse.json(
        { error: 'No response body from Edge Function' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API route: Edge function error status:', response.status)
      console.error('API route: Edge function error text:', errorText)
      return NextResponse.json(
        { error: `Failed to get AI advice: ${response.status} - ${errorText}` },
        { status: 500 }
      )
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in generate-ai-advice API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 