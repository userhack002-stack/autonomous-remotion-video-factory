#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import wave
import base64
import subprocess
from pathlib import Path
from google import genai
from google.genai import types

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


def get_wav_duration(wav_path: str) -> float:
    with wave.open(wav_path, "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        return float(frames) / float(rate)


def generate_deep_hindi_neural_backup(script_text: str, output_wav: str) -> float:
    """
    If Gemini TTS preview model is restricted for new API keys, generates a rich,
    deep documentary Hindi voiceover using Microsoft Edge Neural TTS (hi-IN-MadhurNeural)
    converted to pure 24kHz 16-bit mono PCM WAV via FFmpeg. NEVER produces silent audio!
    """
    print("🎙️ Running Deep Hindi Documentary Voice Engine (Madhur Neural Studio Backup)...")
    os.makedirs(os.path.dirname(output_wav), exist_ok=True)
    temp_mp3 = output_wav.replace(".wav", "_temp.mp3")
    clean_text = script_text.replace('"', '').replace("'", "").strip()

    subprocess.run([
        "edge-tts",
        "--voice", "hi-IN-MadhurNeural",
        "--rate=-4%",
        "--pitch=-6Hz",
        "--text", clean_text,
        "--write-media", temp_mp3
    ], check=True)

    subprocess.run([
        "ffmpeg", "-y", "-i", temp_mp3,
        "-acodec", "pcm_s16le", "-ac", "1", "-ar", "24000",
        output_wav
    ], check=True)

    if os.path.exists(temp_mp3):
        os.remove(temp_mp3)

    dur = get_wav_duration(output_wav)
    print(f"✅ Generated 100% Audible Studio WAV: {output_wav} ({dur:.2f}s)")
    return dur


def generate_pure_gemini_charon_audio(api_key: str, script_text: str, output_filename: str) -> float:
    director_prompt_and_script = f"""
Audio Profile: A charismatic, sharp Indian male tech & business storyteller in a soundproof studio.
Delivery Style: Warm chest resonance, crystal clear diction, natural human breathing, suspenseful hook, deliberate pauses on '...' and '—', and punchy emphasis on numbers and key rules. No robotic rushing.

Transcript to read aloud:
{script_text.strip()}
"""
    if api_key:
        print("🎙️ Attempting single-take studio audio with Gemini 'Charon' voice...")
        client = genai.Client(api_key=api_key)
        tts_models = [
            "gemini-2.5-flash-preview-tts",
            "gemini-2.5-pro-preview-tts",
            "gemini-3.8-flash-preview-tts",
            "gemini-3.5-flash-preview-tts"
        ]
        for model_name in tts_models:
            try:
                print(f"  Trying {model_name} (Voice: Charon)...")
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
                if pcm_bytes and len(pcm_bytes) > 1000:
                    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
                    with wave.open(output_filename, "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(pcm_bytes)
                    exact_duration_sec = len(pcm_bytes) / (24000.0 * 2.0)
                    print(f"✅ Saved pure Gemini 'Charon' studio WAV: {output_filename} ({exact_duration_sec:.2f}s)")
                    return exact_duration_sec
            except Exception as e:
                print(f"  ⚠️ {model_name} unavailable on this key: {e}")

    # Guarantee 100% real audible Hindi voiceover if Gemini TTS preview is restricted on the key
    return generate_deep_hindi_neural_backup(script_text, output_filename)


def main():
    db_path = Path("data/database.json")
    db = json.loads(db_path.read_text(encoding="utf-8"))

    # Read queue file or env variable
    queue_path = Path("data/render_queue.json")
    queue_data = {}
    if queue_path.exists():
        try:
            queue_data = json.loads(queue_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    prompt_id = os.environ.get("PROMPT_ID", "").strip() or queue_data.get("prompt_id", "").strip()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not api_key and queue_data.get("key_b64"):
        try:
            api_key = base64.b64decode(queue_data["key_b64"]).decode("utf-8").strip()
        except Exception:
            pass

    if not api_key and db.get("brand", {}).get("key_b64"):
        try:
            api_key = base64.b64decode(db["brand"]["key_b64"]).decode("utf-8").strip()
        except Exception:
            pass

    target_prompt = None
    for p in db.get("prompts", []):
        if str(p.get("id")) == str(prompt_id):
            target_prompt = p
            break

    if not target_prompt and db.get("prompts"):
        target_prompt = db["prompts"][0]

    if not target_prompt:
        raise ValueError("❌ No prompt found in data/database.json to render!")

    # Write chosen prompt_id so post_release_updater knows which prompt was rendered
    Path("data/active_prompt_id.txt").write_text(str(target_prompt["id"]), encoding="utf-8")

    script_text = target_prompt.get("director_script", "").strip()
    if not script_text:
        script_text = "क्या आपकी वेबसाइट सुरक्षित है? आज ही अपनी वेबसाइट के इन महत्वपूर्ण नियमों की जांच करें और अपने बिजनेस को सुरक्षित बनाएं।"

    wav_out = "remotion_studio/public/voiceover.wav"
    audio_duration = generate_pure_gemini_charon_audio(api_key, script_text, wav_out)

    scenes = target_prompt.get("scenes", [])
    raw_total = sum(float(s.get("duration_sec", 5.0)) for s in scenes) or 55.0
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
    print(f"✅ Synced {len(scenes)} Remotion visual scenes to {audio_duration:.2f}s real voiceover!")


if __name__ == "__main__":
    main()
