import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { reviewContent, reviewId } = await req.json();

    if (!reviewContent || !reviewId) {
      return NextResponse.json(
        { error: 'Review content and review ID are required' },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment variables:', { 
      supabaseUrl: !!supabaseUrl, 
      anonKey: !!anonKey 
    });
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-coach-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        reviewContent,
        reviewId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate AI coach advice' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in AI coach advice API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 