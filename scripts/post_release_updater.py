#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import time
from pathlib import Path

def main():
    pid = os.environ.get("PID", "").strip()
    repo = os.environ.get("REPO", "").strip()
    run_no = os.environ.get("RUN_NO", "1").strip()
    tag = f"reel-{pid}-{run_no}"

    mp4_url = f"https://github.com/{repo}/releases/download/{tag}/reel_{pid}.mp4"
    wav_url = f"https://github.com/{repo}/releases/download/{tag}/voiceover.wav"
    rel_page = f"https://github.com/{repo}/releases/tag/{tag}"

    db_path = Path("data/database.json")
    db = json.loads(db_path.read_text(encoding="utf-8"))

    for p in db.get("prompts", []):
        if str(p.get("id")) == str(pid):
            p["status"] = "completed"
            p["mp4_url"] = mp4_url
            p["wav_url"] = wav_url
            p["release_url"] = rel_page

    db.setdefault("rendered_videos", []).insert(0, {
        "prompt_id": pid,
        "tag": tag,
        "mp4_url": mp4_url,
        "wav_url": wav_url,
        "release_url": rel_page,
        "rendered_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    })

    db_path.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ Updated database.json with release tag: {tag}")

if __name__ == "__main__":
    main()
