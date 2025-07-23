import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") || "pNInz6obpgDQGcFmaJgB"; // Adam (日本語対応)

serve(async (req) => {
  // CORSプリフライト対応
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }

  let text = "";
  let language = "ja"; // デフォルトは日本語

  try {
    const body = await req.json();
    text = body.text?.toString() || "";
    language = body.language || "ja";
    
    if (!text) throw new Error("No text provided");

    // 日本語テキストの前処理
    if (language === "ja") {
      // 句読点の正規化
      text = text.replace(/[、。]/g, (match) => {
        return match === "、" ? "," : ".";
      });
      
      // 長い文章を適切な長さに分割（音声品質向上のため）
      const sentences = text.split(/[。！？]/).filter((s) => s.trim());
      if (sentences.length > 1 && text.length > 200) {
        // 長い文章の場合は最初の2文までに制限
        text = sentences.slice(0, 2).join("。") + "。";
      }
      
      // 特殊文字の除去
      text = text.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3000-\u303F\uFF00-\uFFEF\s,.]/g, "");
    }
  } catch {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
      }
    });
  }

  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({
      error: "Missing ElevenLabs API key"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
      }
    });
  }

  // 日本語専用の音声設定
  const japaneseVoiceSettings = {
    stability: 0.8,
    similarity_boost: 0.9,
    style: 0.2,
    use_speaker_boost: true
  };

  // 英語用の音声設定
  const englishVoiceSettings = {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true
  };

  const voiceSettings = language === "ja" ? japaneseVoiceSettings : englishVoiceSettings;
  const modelId = language === "ja" ? "eleven_multilingual_v2" : "eleven_monolingual_v1";

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
  
  const elevenRes = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: voiceSettings
    })
  });

  if (!elevenRes.ok || !elevenRes.body) {
    const err = await elevenRes.text();
    return new Response(JSON.stringify({
      error: "TTS failed",
      detail: err
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
      }
    });
  }

  return new Response(elevenRes.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
    }
  });
}); 