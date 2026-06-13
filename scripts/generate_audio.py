#!/usr/bin/env python3
"""
Generate offline MP3 audio for every dialogue line, phrase, and key vocab word
using Microsoft edge-tts (free, natural voices). Run once with internet; the
resulting MP3s are bundled and play fully offline in the PWA.

Setup:
    pip install edge-tts
Run:
    python3 scripts/generate_audio.py

Output:
    audio/<id>.mp3            one per line / phrase
    audio/word-<slug>.mp3     one per key vocab word
    audio/manifest.json       list used by the service worker to precache
"""
import asyncio
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(HERE, "data", "content.json")
AUDIO_DIR = os.path.join(HERE, "audio")

# Voice per speaker role (natural US English voices)
VOICES = {
    "staff": "en-US-AriaNeural",
    "you": "en-US-GuyNeural",
    "tip": "en-US-JennyNeural",
    "word": "en-US-JennyNeural",
}


def slug(w):
    return re.sub(r"[^a-z0-9]+", "-", w.lower()).strip("-")


def collect(content):
    """Return list of (id, text, voice)."""
    items = {}
    for s in content.get("scenarios", []):
        for l in s.get("lines", []):
            items[l["id"]] = (l["en"], VOICES.get(l.get("speaker"), VOICES["you"]))
            for v in l.get("vocab", []) or []:
                wid = "word-" + slug(v["w"])
                items.setdefault(wid, (v["w"], VOICES["word"]))
    for p in content.get("phrasebook", []):
        items[p["id"]] = (p["en"], VOICES["you"])
    return [(k, v[0], v[1]) for k, v in items.items()]


async def synth(edge_tts, text, voice, out_path):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)


async def main():
    try:
        import edge_tts
    except ImportError:
        print("缺少 edge-tts，请先运行: pip install edge-tts", file=sys.stderr)
        sys.exit(1)

    with open(CONTENT, encoding="utf-8") as f:
        content = json.load(f)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    items = collect(content)
    print(f"准备生成 {len(items)} 个音频...")

    for i, (aid, text, voice) in enumerate(items, 1):
        fname = aid + ".mp3"
        out = os.path.join(AUDIO_DIR, fname)
        if os.path.exists(out) and os.path.getsize(out) > 0:
            continue
        try:
            await synth(edge_tts, text, voice, out)
            print(f"[{i}/{len(items)}] {fname}")
        except Exception as e:
            print(f"  跳过 {fname}: {e}", file=sys.stderr)

    # manifest lists only MP3s that were actually created (used for offline precache)
    made = sorted(
        f for f in os.listdir(AUDIO_DIR)
        if f.endswith(".mp3") and os.path.getsize(os.path.join(AUDIO_DIR, f)) > 0
    )
    manifest_path = os.path.join(AUDIO_DIR, "manifest.json")
    if made:
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(made, f, ensure_ascii=False, indent=0)
        print(f"完成。{len(made)} 个音频，manifest.json 已写入用于离线预缓存。")
    else:
        if os.path.exists(manifest_path):
            os.remove(manifest_path)
        print("未生成任何音频（无网络？）。app 将自动回退到浏览器朗读。")


if __name__ == "__main__":
    asyncio.run(main())
