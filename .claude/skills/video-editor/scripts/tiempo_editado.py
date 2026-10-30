"""Imprime las palabras de un rango del original con su segundo en el video editado (plan y palabras ya en tiempo del master)."""
import json, sys
plan, words, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
keep = json.load(open(plan))["keep"]
def r(t):
    acc = 0.0
    for s, e in keep:
        if s <= t <= e: return acc + t - s
        acc += e - s
for w in json.load(open(words))["words"]:
    if a <= w["start"] <= b:
        x = r(w["start"]); print(f"{x:7.2f} {w['word']}" if x is not None else f"   --   {w['word']}")
