#!/usr/bin/env python3
"""plan_cuts.py - propone qué partes conservar a partir de palabras.json.

    python3 plan_cuts.py palabras.json --out plan.json [--gap 0.5] [--pad 0.12]

Marca para quitar:
  - frases con una señal de repetición ("repito", "otra vez", "de nuevo", "corta", "let's redo that")
    y la frase anterior a la señal (la toma mala);
  - una frase que arranca con las mismas 3 palabras que la siguiente (se queda la última);
  - todo silencio entre palabras de más de --gap segundos (se deja --pad a cada lado).

Es una propuesta: revisa plan.json ("drop") antes de renderizar. Para devolver una frase, bórrala
de "drop" y vuelve a correr con --keep-drop plan.json.
"""
import argparse, json, re, sys, unicodedata

MARKERS = re.compile(r"\b(repito|otra vez|de nuevo|corta|cortemos|vamos otra vez|desde el principio|"
                     r"me equivoqu[eé]|let'?s redo( that)?|again|cut)\b", re.I)

def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    return [w for w in re.sub(r"[^a-z0-9ñ ]", " ", "".join(c for c in t if unicodedata.category(c) != "Mn")).split()]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words")
    ap.add_argument("--out", required=True)
    ap.add_argument("--gap", type=float, default=0.5)
    ap.add_argument("--pad", type=float, default=0.12)
    ap.add_argument("--keep-drop", help="usar la lista 'drop' de un plan ya revisado")
    a = ap.parse_args()
    d = json.load(open(a.words))
    words = d["words"]
    # Frases propias (cortadas en . ? ! o en un silencio de más de 1 s), no los bloques de Whisper:
    # Whisper a veces une "repito" con la toma buena en el mismo bloque.
    segs, n = [], 0
    for k, w in enumerate(words):
        if k and (words[k - 1]["word"][-1:] in ".?!" or w["start"] - words[k - 1]["end"] > 1.0):
            n += 1
        w["seg"] = n
        if len(segs) <= n:
            segs.append({"i": n, "start": w["start"], "end": w["end"], "text": w["word"]})
        else:
            segs[n]["end"] = w["end"]; segs[n]["text"] += " " + w["word"]

    if a.keep_drop:
        drop = {x["i"]: x for x in json.load(open(a.keep_drop))["drop"]}
    else:
        drop = {}
        for s in segs:
            if MARKERS.search(s["text"]):
                drop[s["i"]] = {**s, "reason": "señal de repetición"}
                prev = s["i"] - 1
                # si la señal está sola en la frase, la toma mala es la anterior
                if prev >= 0 and len(norm(s["text"])) <= 4:
                    drop.setdefault(prev, {**segs[prev], "reason": "toma anterior a la señal"})
        for s, nxt in zip(segs, segs[1:]):
            a3, b3 = norm(s["text"])[:3], norm(nxt["text"])[:3]
            if len(a3) == 3 and a3 == b3:
                drop.setdefault(s["i"], {**s, "reason": "repetición: empieza igual que la siguiente"})

    kept = [w for w in words if w["seg"] not in drop]
    keep, pauses = [], 0
    for w in kept:
        s, e = max(0.0, w["start"] - a.pad), w["end"] + a.pad
        if keep and s - keep[-1][1] <= a.gap - 2 * a.pad + 1e-6:
            keep[-1][1] = max(keep[-1][1], e)
        else:
            if keep: pauses += 1
            keep.append([s, e])
    keep = [[round(s, 3), round(min(e, d["duration"]), 3)] for s, e in keep]
    total = sum(e - s for s, e in keep)
    plan = {"source": d["source"], "gap": a.gap, "pad": a.pad, "keep": keep,
            "drop": sorted(drop.values(), key=lambda x: x["i"]),
            "original_s": d["duration"], "edited_s": round(total, 2)}
    json.dump(plan, open(a.out, "w"), ensure_ascii=False, indent=1)
    print(f"original {d['duration']:.1f}s -> editado {total:.1f}s | {len(drop)} frases quitadas | "
          f"{pauses} pausas recortadas", file=sys.stderr)
    for x in plan["drop"]:
        print(f"  quitar {x['start']:7.2f}-{x['end']:7.2f}  [{x['reason']}]  {x['text']}", file=sys.stderr)

if __name__ == "__main__":
    main()
