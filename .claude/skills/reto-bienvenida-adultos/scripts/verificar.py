"""Verificadores de los retos de bienvenida. Uso:
  python3 verificar.py jarras-luchins          # problemas de Luchins: qué método sirve en cada uno
  python3 verificar.py jarras 8 5 3 4          # versión física: pasos mínimos para dejar 4 litros
  python3 verificar.py hanoi 3                 # movimientos mínimos y secuencia
  python3 verificar.py nueve-puntos            # busca una solución de 4 líneas
  python3 verificar.py vasos 3 "1-2,2-3,1-3" 1 # dónde queda la pelota tras los cambios
  python3 pitillos.py "VI=VII+I"               # ecuaciones de pitillos (soluciones con 1 movimiento)
"""
import sys, itertools
from collections import deque

LUCHINS = [  # (A, B, C, meta) del experimento clásico de Luchins (1942)
    (21, 127, 3, 100), (14, 163, 25, 99), (18, 43, 10, 5), (9, 42, 6, 21), (20, 59, 4, 31),
    (23, 49, 3, 20), (15, 39, 3, 18), (28, 76, 3, 25), (18, 48, 4, 22), (14, 36, 8, 6)]

def jarras_luchins():
    for i, (a, b, c, m) in enumerate(LUCHINS, 1):
        largo = b - a - 2 * c == m
        cortos = [n for n, v in (('A-C', a - c), ('A+C', a + c)) if v == m]
        print(f'{i:2}. A={a} B={b} C={c} meta={m} | B-A-2C: {"sí" if largo else "NO"} | atajo: {", ".join(cortos) or "no"}')

def jarras(caps, meta):
    start = (caps[0],) + (0,) * (len(caps) - 1)
    prev, q = {start: None}, deque([start])
    while q:
        s = q.popleft()
        if meta in s:
            path = []
            while s: path.append(s); s = prev[s]
            for k, st in enumerate(reversed(path)): print(f'paso {k}: {st}')
            return
        for i, j in itertools.permutations(range(len(caps)), 2):
            t = list(s); x = min(t[i], caps[j] - t[j]); t[i] -= x; t[j] += x; t = tuple(t)
            if x and t not in prev: prev[t] = s; q.append(t)
    print('sin solución')

def hanoi(n, a='A', b='B', c='C', out=None):
    if out is None:
        out = []; hanoi(n, a, b, c, out)
        print(f'{n} piezas: {len(out)} movimientos (mínimo 2^n - 1 = {2**n - 1})')
        print(', '.join(f'{p}→{d}' for p, d in out)); return
    if n == 0: return
    hanoi(n - 1, a, c, b, out); out.append((n, c)); hanoi(n - 1, b, a, c, out)

def nueve_puntos():
    pts = {(x, y) for x in range(3) for y in range(3)}
    rng = range(-1, 4)
    def on(p, q, r):
        (x1, y1), (x2, y2), (x, y) = p, q, r
        return (x2 - x1) * (y - y1) == (y2 - y1) * (x - x1) and min(x1, x2) <= x <= max(x1, x2) and min(y1, y2) <= y <= max(y1, y2)
    V = [(x, y) for x in rng for y in rng]
    for path in itertools.product(V, repeat=5):
        if any(path[i] == path[i + 1] for i in range(4)): continue
        if all(any(on(path[i], path[i + 1], p) for i in range(4)) for p in pts):
            print('Solución (vértices, puntos en 0..2):', path); return
    print('no encontrada')

def vasos(n, swaps, ball):
    for s in swaps.split(','):
        i, j = map(int, s.split('-'))
        ball = j if ball == i else i if ball == j else ball
    print(f'La pelota termina en el vaso {ball} (de {n})')

if __name__ == '__main__':
    cmd, *a = sys.argv[1:] or ['-h']
    if cmd == 'jarras-luchins': jarras_luchins()
    elif cmd == 'jarras': *c, m = map(int, a); jarras(c, m)
    elif cmd == 'hanoi': hanoi(int(a[0]))
    elif cmd == 'nueve-puntos': nueve_puntos()
    elif cmd == 'vasos': vasos(int(a[0]), a[1], int(a[2]))
    else: print(__doc__)
