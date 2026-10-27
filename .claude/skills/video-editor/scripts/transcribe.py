#!/usr/bin/env python3
"""transcribe.py - Whisper (faster-whisper) con el tiempo de cada palabra.

    python3 transcribe.py video.mp4 --out palabras.json [--model medium] [--lang es]

Escribe palabras.json ({"segments": [...], "words": [...]}) y un .srt al lado.
"""
import argparse, json, os, subprocess, sys, time

def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}".replace(".", ",")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="medium")
    ap.add_argument("--lang", default="es")
    a = ap.parse_args()
    import numpy as np
    from faster_whisper import WhisperModel
    t0 = time.time()
    # El audio lo decodifica FFmpeg (16 kHz mono), así no dependemos de la versión de PyAV.
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", a.input, "-vn", "-ac", "1",
                          "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, info = model.transcribe(audio, language=a.lang, word_timestamps=True,
                                  vad_filter=False, condition_on_previous_text=False)
    segments, words = [], []
    for i, s in enumerate(segs):
        segments.append({"i": i, "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
        print(f"avance {s.end:7.1f}s / {info.duration:.1f}s", file=sys.stderr, flush=True)
        for w in s.words or []:
            words.append({"seg": i, "start": round(w.start, 3), "end": round(w.end, 3),
                          "word": w.word.strip(), "p": round(w.probability, 3)})
    json.dump({"source": os.path.abspath(a.input), "duration": round(info.duration, 3),
               "segments": segments, "words": words}, open(a.out, "w"), ensure_ascii=False, indent=1)
    srt = os.path.splitext(a.out)[0] + ".srt"
    with open(srt, "w") as f:
        for n, s in enumerate(segments, 1):
            f.write(f"{n}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n\n")
    print(f"{len(segments)} frases, {len(words)} palabras, {info.duration:.1f}s de audio, "
          f"{time.time() - t0:.0f}s de proceso -> {a.out}", file=sys.stderr)

if __name__ == "__main__":
    main()
