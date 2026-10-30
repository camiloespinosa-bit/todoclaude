"""Quita de 'keep' todo lo que cae dentro de los rangos de 'drop' (Whisper alarga la última palabra antes
de una pausa y el tramo conservado se metía en la toma descartada)."""
import json, sys
p = json.load(open(sys.argv[1]))
drops = sorted((x["start"], x["end"]) for x in p["drop"])
keep = []
for s, e in p["keep"]:
    parts = [[s, e]]
    for ds, de in drops:
        nuevo = []
        for a, b in parts:
            if de <= a or ds >= b: nuevo.append([a, b]); continue
            if a < ds: nuevo.append([a, ds])
            if de < b: nuevo.append([de, b])
        parts = nuevo
    keep += [[round(a, 3), round(b, 3)] for a, b in parts if b - a > 0.08]
p["keep"] = keep; p["edited_s"] = round(sum(b - a for a, b in keep), 2)
json.dump(p, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(f"{sys.argv[2]}: {len(keep)} tramos, {p['edited_s']} s")
