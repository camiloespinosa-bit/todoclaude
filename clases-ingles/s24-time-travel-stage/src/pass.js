// Class passes: the teacher signs "code + expiry date"; any game page can check the signature
// by itself (no server, no teacher page left open). The signing key is sealed with the teacher
// key (PBKDF2 + AES-GCM), so only someone who knows the teacher key can create passes.
const PUB = "BNW1yN2FCC45Tfr5Iw70pXpvztcW8zDDfZI/iWH38HWgSV7PdLuCThFNcbZD5etLlcrrIG/L7SQ8BN/pIE6tQjw=";
const BOX = {"s":"jePjG1RsfpLuBDAxoNuIsg==","iv":"3z3pFWL67fqPNcZV","ct":"mTTsybZVUo+c6xbLCg/5TbBlG/pPp17jk5ChWT3J163fPCpzYFp4fanW2TdoyZfaP/vhymfMy3EUPSB3eZ5JPWZumqd90NDxnWum3h5+oCFwlNshH4lwoOZNqITB4vvjQjBsC/2yj/4b3Gy59pnSlS45pCsyNnVyL0Tzpfw22lSpXq9/v4acpeXj0UzeFnTgrXFYzfwbW5EegnztR415WQcIHbZy5QBaf03EAQMU/1sa9UnRczkxRu+xFiQEQB9x7//uELnbwYnbfdK8koYw4OrCOWyB/j6ZWAXY7SRl"};
const enc = new TextEncoder();
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
const ALG = { name: "ECDSA", namedCurve: "P-256" };
const SIG = { name: "ECDSA", hash: "SHA-256" };
export const canCrypto = () => !!(window.crypto && crypto.subtle);
export const cleanKey = (k) => (k || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// returns the signing key when the teacher key is right, otherwise null
export async function openTeacher(key) {
  key = cleanKey(key);
  if (!key || !canCrypto()) return null;
  try {
    const base = await crypto.subtle.importKey("raw", enc.encode("cca-profe|" + key), "PBKDF2", false, ["deriveKey"]);
    const aes = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(BOX.s), iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const jwk = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(BOX.iv) }, aes, unb64(BOX.ct))));
    return await crypto.subtle.importKey("jwk", jwk, ALG, false, ["sign"]);
  } catch (e) {
    return null;
  }
}
const msg = (code, exp) => enc.encode(`cca-pass|${cleanKey(code)}|${exp}`);
// pass = <expiry in minutes since 1970, base 36>.<signature>
export async function signPass(priv, code, expMs) {
  const exp = Math.ceil(expMs / 60000).toString(36);
  const sig = new Uint8Array(await crypto.subtle.sign(SIG, priv, msg(code, exp)));
  return `${exp}.${b64u(sig)}`;
}
// returns the expiry time (ms) when the pass is valid for this code, otherwise 0
export async function checkPass(code, pass) {
  try {
    const [exp, sig] = String(pass || "").split(".");
    if (!exp || !sig || !canCrypto()) return 0;
    const until = parseInt(exp, 36) * 60000;
    if (!(until > Date.now())) return 0;
    const pub = await crypto.subtle.importKey("raw", unb64(PUB), ALG, false, ["verify"]);
    return (await crypto.subtle.verify(SIG, pub, unb64u(sig), msg(code, exp))) ? until : 0;
  } catch (e) {
    return 0;
  }
}

// token the teacher page shows to the results database (only its SHA-256 is stored there)
export async function teacherToken(key) {
  const base = await crypto.subtle.importKey("raw", enc.encode("cca-profe|" + cleanKey(key)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode("cca-db-token"), iterations: 250000, hash: "SHA-256" }, base, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
