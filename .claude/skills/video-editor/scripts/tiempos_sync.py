"""Pasa tiempos del audio original (Whisper) al tiempo de master_sync.mkv: v = (t + c) / k."""
import json, sys
k, c = 1.00023256, 0.13558
f = lambda t: round((t + c) / k, 3)
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
if "words" in d:
    for w in d["words"]: w["start"], w["end"] = f(w["start"]), f(w["end"])
    for s in d.get("segments", []): s["start"], s["end"] = f(s["start"]), f(s["end"])
if "keep" in d:
    d["keep"] = [[f(a), f(b)] for a, b in d["keep"]]
    for x in d["drop"]: x["start"], x["end"] = f(x["start"]), f(x["end"])
json.dump(d, open(out, "w"), ensure_ascii=False, indent=1)
