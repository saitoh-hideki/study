import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  text: string
  messageId: string
  voiceType?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, messageId, voiceType = 'Rachel' }: RequestBody = await req.json()

    if (!text || !messageId) {
      return new Response(
        JSON.stringify({ error: 'Text and messageId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get ElevenLabs API key from environment
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Voice ID mapping
    const voiceIds = {
      'Rachel': '21m00Tcm4TlvDq8ikWAM', // Rachel - Female
      'John': 'AZnzlk1XvdvUeBnXmlld',   // Domi - Male
      'Emma': 'EXAVITQu4vr4xnSDxMaL',   // Bella - Young Female
      'David': 'VR6AewLTigWG4xSOukaG'   // Arnold - Young Male
    }

    const voiceId = voiceIds[voiceType as keyof typeof voiceIds] || voiceIds['Rachel']

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.text()
      console.error('ElevenLabs API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate speech' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Upload audio to Supabase Storage
    const fileName = `audio/${messageId}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading audio:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName)

    const audioUrl = urlData.publicUrl

    // Update message with audio URL
    const { error: updateError } = await supabase
      .from('messages')
      .update({ audio_url: audioUrl })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error updating message:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        audioUrl: audioUrl,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 