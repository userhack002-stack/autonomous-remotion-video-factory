#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v5.3 Bulletproof Cloud Audio & Beat-Sync Producer:
1. Calls Gemini TTS strictly over v1beta (fixes 'Unknown name speechConfig' 400 error).
2. Auto-detects active TTS models on the user's API key via v1beta/models.
3. Falls back seamlessly to Deep Studio Hindi Documentary Voice if Google restricts
   preview TTS models for new keys — NEVER crashes with exit code 1!
4. Locks every visual beat & 3-4 word caption chunk to exact spoken acoustic weights.
"""
import os
import re
import json
import wave
import base64
import subprocess
import urllib.request
import urllib.error
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
        "accent_soft": "rgba(255, 59, 78, 0.16)",
        "text_primary": "#ffffff",
        "text_muted": "#9ca3af"
    },
    "Template 2: Cyber Matrix Emerald": {
        "id": "cyber_emerald",
        "bg": "#0b1315",
        "card_bg": "#122124",
        "card_border": "#1f3a3f",
        "accent": "#00e676",
        "accent_soft": "rgba(0, 230, 118, 0.16)",
        "text_primary": "#f0fdf4",
        "text_muted": "#86efac"
    },
    "Template 3: Executive FinTech Gold": {
        "id": "fintech_gold",
        "bg": "#0f172a",
        "card_bg": "#1e293b",
        "card_border": "#334155",
        "accent": "#f59e0b",
        "accent_soft": "rgba(245, 158, 11, 0.16)",
        "text_primary": "#f8fafc",
        "text_muted": "#94a3b8"
    }
}

DIRECTOR_HEADER = """Audio Profile: A charismatic, sharp Indian male tech & business storyteller in a soundproof studio.
Delivery Style: Warm chest resonance, crystal clear diction, natural human breathing, suspenseful hook, deliberate pauses on '...' and '—', and punchy emphasis on numbers and key rules. No robotic rushing.

Transcript to read aloud:"""


def save_pcm_to_wav(pcm_bytes: bytes, output_filename: str) -> float:
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    with wave.open(output_filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(pcm_bytes)
    return len(pcm_bytes) / (24000.0 * 2.0)


def get_wav_duration(wav_path: str) -> float:
    with wave.open(wav_path, "rb") as wf:
        return float(wf.getnframes()) / float(wf.getframerate())


def generate_deep_studio_backup_voice(full_transcript: str, output_filename: str) -> float:
    """
    Produces a rich, deep chest-resonance Hindi documentary studio voiceover
    (24kHz 16-bit mono WAV) if the user's Google API Key does not have TTS preview access.
    """
    print("🎙️ Running Deep Studio Documentary Voice Engine (24kHz Uncompressed WAV)...")
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    temp_mp3 = output_filename.replace(".wav", "_raw.mp3")

    # Convert dramatic script pauses ('...' and '—') into natural breathing pauses
    clean_script = full_transcript.replace("...", " , ").replace("—", " , ").replace('"', "").strip()

    subprocess.run([
        "edge-tts",
        "--voice", "hi-IN-MadhurNeural",
        "--rate=-3%",
        "--pitch=-5Hz",
        "--text", clean_script,
        "--write-media", temp_mp3
    ], check=True)

    subprocess.run([
        "ffmpeg", "-y", "-i", temp_mp3,
        "-acodec", "pcm_s16le", "-ac", "1", "-ar", "24000",
        output_filename
    ], check=True)

    if os.path.exists(temp_mp3):
        os.remove(temp_mp3)

    dur = get_wav_duration(output_filename)
    print(f"✅ Saved 24kHz Studio WAV: {output_filename} ({dur:.2f}s)")
    return dur


def generate_pure_gemini_audio(api_key: str, full_transcript: str, voice_name: str, output_filename: str) -> float:
    director_prompt_and_script = f"{DIRECTOR_HEADER}\n{full_transcript.strip()}\n"

    if api_key:
        # 1. Discover any active TTS models on this API key via v1beta
        tts_candidates = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key.strip()}")
            with urllib.request.urlopen(req, timeout=15) as resp:
                models_data = json.loads(resp.read().decode("utf-8"))
                discovered = [
                    m["name"].replace("models/", "")
                    for m in models_data.get("models", [])
                    if "tts" in m.get("name", "").lower()
                ]
                for d in discovered:
                    if d not in tts_candidates:
                        tts_candidates.insert(0, d)
        except Exception as e:
            print(f"  ℹ️ Model list check note: {e}")

        # 2. Try google-genai SDK explicitly pinned to v1beta (prevents 'Unknown name speechConfig' on v1)
        try:
            client = genai.Client(api_key=api_key.strip(), http_options={"api_version": "v1beta"})
            for model_name in tts_candidates:
                try:
                    print(f"🎙️ Trying Gemini v1beta TTS model '{model_name}' with '{voice_name}' voice...")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=director_prompt_and_script,
                        config=types.GenerateContentConfig(
                            response_modalities=["AUDIO"],
                            speech_config=types.SpeechConfig(
                                voice_config=types.VoiceConfig(
                                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                        voice_name=voice_name
                                    )
                                )
                            ),
                        ),
                    )
                    pcm_bytes = response.candidates[0].content.parts[0].inline_data.data
                    if pcm_bytes and len(pcm_bytes) > 1000:
                        dur = save_pcm_to_wav(pcm_bytes, output_filename)
                        print(f"✅ Saved pure Gemini '{voice_name}' studio file: {output_filename} ({dur:.2f}s)")
                        return dur
                except Exception as sdk_err:
                    print(f"  ⚠️ {model_name} (v1beta SDK) note: {sdk_err}")
        except Exception as client_err:
            print(f"  ⚠️ Client init note: {client_err}")

    # 3. Seamless fallback so GitHub Actions NEVER fails with exit code 1
    return generate_deep_studio_backup_voice(full_transcript, output_filename)


def compute_spoken_weight(hindi_text: str) -> float:
    t = (hindi_text or "").strip()
    if not t:
        return 10.0
    pause_dots = t.count("...") * 6.5
    pause_dash = t.count("—") * 4.5
    pause_q = (t.count("?") + t.count("!") + t.count("।")) * 3.5
    pause_comma = t.count(",") * 2.0
    clean_chars = len(re.sub(r"[\s\.\—\?\!\,\।]", "", t))
    return max(8.0, float(clean_chars) + pause_dots + pause_dash + pause_q + pause_comma)


def decode_stored_key(raw_b64: str) -> str:
    if not raw_b64:
        return ""
    # Try reversed base64 first (v5.2 secret-safe format), then standard base64
    for candidate in (raw_b64[::-1], raw_b64):
        try:
            decoded = base64.b64decode(candidate).decode("utf-8").strip()
            if decoded.startswith("AIza"):
                return decoded
        except Exception:
            pass
    return ""


def main():
    db_path = Path("data/database.json")
    db = json.loads(db_path.read_text(encoding="utf-8"))

    queue_path = Path("data/render_queue.json")
    queue_data = {}
    if queue_path.exists():
        try:
            queue_data = json.loads(queue_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    prompt_id = os.environ.get("PROMPT_ID", "").strip() or queue_data.get("prompt_id", "").strip()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not api_key:
        api_key = decode_stored_key(queue_data.get("key_b64", ""))
    if not api_key:
        api_key = decode_stored_key(db.get("brand", {}).get("key_b64", ""))

    target_prompt = None
    for p in db.get("prompts", []):
        if str(p.get("id")) == str(prompt_id):
            target_prompt = p
            break

    if not target_prompt and db.get("prompts"):
        target_prompt = db["prompts"][0]

    if not target_prompt:
        raise ValueError("❌ No prompt found in data/database.json to render!")

    Path("data/active_prompt_id.txt").write_text(str(target_prompt["id"]), encoding="utf-8")

    scenes = target_prompt.get("scenes", [])
    beat_lines = [s.get("spoken_hindi", "").strip() for s in scenes if s.get("spoken_hindi", "").strip()]
    if beat_lines:
        unified_transcript = "\n".join(beat_lines)
    else:
        unified_transcript = target_prompt.get("director_script", "").strip()

    if not unified_transcript:
        unified_transcript = "क्या आपकी वेबसाइट सुरक्षित है? आज ही इन महत्वपूर्ण नियमों की जांच करें।"

    wav_out = "remotion_studio/public/voiceover.wav"
    audio_duration = generate_pure_gemini_audio(api_key, unified_transcript, "Charon", wav_out)

    weights = [compute_spoken_weight(s.get("spoken_hindi", s.get("caption_hinglish", ""))) for s in scenes]
    total_weight = sum(weights) or 100.0

    for idx, s in enumerate(scenes):
        exact_sec = (weights[idx] / total_weight) * audio_duration
        s["duration_sec"] = round(max(1.8, exact_sec), 3)

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
        "audio_duration_sec": round(audio_duration, 3),
        "scenes": scenes
    }

    out_json = Path("remotion_studio/src/video_data.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(video_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ Synced {len(scenes)} visual beats & phrase captions to {audio_duration:.2f}s Studio Audio!")


if __name__ == "__main__":
    main()
