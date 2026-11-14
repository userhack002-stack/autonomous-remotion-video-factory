#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import wave
import math
import struct
from pathlib import Path
from google import genai
from google.genai import types

PROMPT_ID = os.environ.get("PROMPT_ID", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

THEMES = {
    "Template 1: Rinisha Dark Crimson": {
        "id": "crimson_dark",
        "bg": "#16161a",
        "card_bg": "#212127",
        "card_border": "#32323c",
        "accent": "#ff3b4e",
        "accent_soft": "rgba(255, 59, 78, 0.18)",
        "text_primary": "#ffffff",
        "text_muted": "#9ca3af"
    },
    "Template 2: Cyber Matrix Emerald": {
        "id": "cyber_emerald",
        "bg": "#0b1315",
        "card_bg": "#122124",
        "card_border": "#1f3a3f",
        "accent": "#00e676",
        "accent_soft": "rgba(0, 230, 118, 0.18)",
        "text_primary": "#f0fdf4",
        "text_muted": "#86efac"
    },
    "Template 3: Executive FinTech Gold": {
        "id": "fintech_gold",
        "bg": "#0f172a",
        "card_bg": "#1e293b",
        "card_border": "#334155",
        "accent": "#f59e0b",
        "accent_soft": "rgba(245, 158, 11, 0.18)",
        "text_primary": "#f8fafc",
        "text_muted": "#94a3b8"
    }
}

def create_fallback_wav(output_filename: str, duration_sec: float = 45.0) -> float:
    """Creates a clean silent studio WAV track if TTS API quota/model fails so render never crashes."""
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    sample_rate = 24000
    num_samples = int(duration_sec * sample_rate)
    with wave.open(output_filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"\x00\x00" * num_samples)
    return duration_sec

def generate_pure_gemini_charon_audio(api_key: str, script_text: str, output_filename: str, target_sec: float) -> float:
    director_prompt_and_script = f"""
Audio Profile: A charismatic, sharp Indian male tech & business storyteller in a soundproof studio.
Delivery Style: Warm chest resonance, crystal clear diction, natural human breathing, suspenseful hook, deliberate pauses on '...' and '—', and punchy emphasis on numbers and key rules. No robotic rushing.

Transcript to read aloud:
{script_text.strip()}
"""
    print("🎙️ Generating single-take studio audio with 'Charon' voice (Deep Documentary Flow)...")
    client = genai.Client(api_key=api_key)

    tts_models = [
        "gemini-2.5-flash-preview-tts",
        "gemini-2.5-pro-preview-tts",
        "gemini-3.8-flash-preview-tts",
        "gemini-2.0-flash-exp"
    ]

    for model_name in tts_models:
        try:
            print(f"  Attempting TTS with model: {model_name} (Voice: Charon)...")
            response = client.models.generate_content(
                model=model_name,
                contents=director_prompt_and_script,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Charon"
                            )
                        )
                    ),
                ),
            )
            pcm_bytes = response.candidates[0].content.parts[0].inline_data.data
            os.makedirs(os.path.dirname(output_filename), exist_ok=True)
            with wave.open(output_filename, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(pcm_bytes)

            exact_duration_sec = len(pcm_bytes) / (24000.0 * 2.0)
            print(f"✅ Saved pure studio WAV ({model_name}): {output_filename} ({exact_duration_sec:.2f}s)")
            return exact_duration_sec
        except Exception as e:
            print(f"  ⚠️ TTS model {model_name} failed: {e}")

    print("⚠️ All TTS models failed or quota exceeded. Generating fallback studio WAV track so video render completes...")
    return create_fallback_wav(output_filename, target_sec)

def main():
    db_path = Path("data/database.json")
    db = json.loads(db_path.read_text(encoding="utf-8"))

    target_prompt = None
    for p in db.get("prompts", []):
        if str(p.get("id")) == str(PROMPT_ID):
            target_prompt = p
            break

    if not target_prompt and db.get("prompts"):
        target_prompt = db["prompts"][0]

    if not target_prompt:
        raise ValueError("❌ No prompt found in data/database.json to render!")

    scenes = target_prompt.get("scenes", [])
    raw_total = sum(float(s.get("duration_sec", 5.0)) for s in scenes) or 55.0

    wav_out = "remotion_studio/public/voiceover.wav"
    if GEMINI_API_KEY:
        audio_duration = generate_pure_gemini_charon_audio(
            GEMINI_API_KEY,
            target_prompt.get("director_script", "नमस्ते, इस वीडियो में हम आपकी वेबसाइट की सुरक्षा और ग्रोथ के बारे में बात करेंगे।"),
            wav_out,
            raw_total
        )
    else:
        print("⚠️ No GEMINI_API_KEY provided to Action; creating fallback timing track.")
        audio_duration = create_fallback_wav(wav_out, raw_total)

    scale_factor = audio_duration / raw_total
    for s in scenes:
        s["duration_sec"] = round(max(2.5, float(s.get("duration_sec", 5.0)) * scale_factor), 2)

    tpl_name = target_prompt.get("selected_template", "Template 1: Rinisha Dark Crimson")
    theme_obj = THEMES.get(tpl_name, THEMES["Template 1: Rinisha Dark Crimson"])

    video_payload = {
        "prompt_id": target_prompt["id"],
        "hook_title": target_prompt.get("hook_title", "Viral Business Reel"),
        "brand": db["brand"],
        "theme": theme_obj,
        "enable_comment_cta": bool(target_prompt.get("enable_comment_cta", True)),
        "comment_keyword": target_prompt.get("comment_keyword", db["brand"].get("default_comment_word", "RULES")),
        "has_audio": True,
        "audio_duration_sec": round(audio_duration, 2),
        "scenes": scenes
    }

    out_json = Path("remotion_studio/src/video_data.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(video_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ Synced {len(scenes)} Remotion visual scenes to {audio_duration:.2f}s audio!")

if __name__ == "__main__":
    main()
