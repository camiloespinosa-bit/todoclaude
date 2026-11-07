import re, itertools, sys
def to_roman(n):
    vals=[(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')];s=''
    for v,r in vals:
        while n>=v: s+=r;n-=v
    return s
def rval(s):
    d={'I':1,'V':5,'X':10};t=0
    for i,c in enumerate(s):
        v=d[c]; t+= -v if i+1<len(s) and d[s[i+1]]>v else v
    return t
def valid(eq):
    if '=' not in eq: return False
    parts=re.split(r'([+\-=])',eq)
    if any(p=='' for p in parts[::2]): return False
    for p in parts[::2]:
        if to_roman(rval(p))!=p or rval(p)>39: return False
    # evaluate each '=' side
    sides=eq.split('='); vals=[]
    for sd in sides:
        toks=re.split(r'([+\-])',sd); v=rval(toks[0])
        for op,n in zip(toks[1::2],toks[2::2]): v = v+rval(n) if op=='+' else v-rval(n)
        vals.append(v)
    return len(set(vals))==1
REMOVE={'I':'','+':'-','=':'-','-':''}
ADD_TO={'-':['+','='],}
INPLACE={'+':['='],'=':['+'],'V':['X'],'X':['V'],'-':['I'],'I':['-']}
def moves(eq):
    out={}
    n=len(eq)
    # in-place
    for i,c in enumerate(eq):
        for c2 in INPLACE.get(c,[]):
            e=eq[:i]+c2+eq[i+1:]; out.setdefault(e,f'pos{i}: {c}->{c2} (mover dentro)')
    # remove then add
    for i,c in enumerate(eq):
        if c not in REMOVE: continue
        r=eq[:i]+REMOVE[c]+eq[i+1:]
        removed_len = 1 if REMOVE[c]=='' else 0
        # add: insert I or - anywhere, or upgrade '-'
        for j in range(len(r)+1):
            for ins in ['I','-']:
                e=r[:j]+ins+r[j:]
                if e!=eq: out.setdefault(e,f'take from pos{i} ({c}), insert {ins} at {j}')
        for j,c3 in enumerate(r):
            for c4 in ADD_TO.get(c3,[]):
                e=r[:j]+c4+r[j+1:]
                if e!=eq: out.setdefault(e,f'take from pos{i} ({c}), {c3}->{c4} at {j}')
    return out
def solve(eq):
    return [(e,how) for e,how in moves(eq).items() if valid(e)]
if __name__=='__main__':
    for eq in sys.argv[1:]:
        print(eq, 'valid already' if valid(eq) else 'false', solve(eq))
