// Class passes: the teacher signs "code + expiry date"; any game page can check the signature
// by itself (no server, no teacher page left open). The signing key is sealed with the teacher
// key (PBKDF2 + AES-GCM), so only someone who knows the teacher key can create passes.
const PUB = "BK1uzhYS6rMtXJrk8h/8f4rOqgq/L+VjEajILLS8gqkJQrrErWIHW46aTwAyUj/pwN6DXzbD4ci6a+ctizOOWcQ=";
const BOX = {"s":"pijM0FClOF3g0ZTAipV3MA==","iv":"1ethQJbbbh7Rd+JJ","ct":"B87/agH/p6/ZzwNItDfQ4Z/DSC9gHc2KJNvEsI1iQ0UoKu83QIExg56LmROkPgbrLQ2hERwbvH8PqLKxkeR18dDgQ0Mw/BlcIAP6lqxiWWENE649TjamePHwZX8PunpyHjeyfcVr2T+TkPTi/lS4dprpGt4/L05wRDRTl3fHp/Vk3G+UIO1n4FuuDS3sXKfpOi1FxrVSFw0SeH/vk3wYIi6Jb7JSFsxvut0b4gG9TPTMVwPg5Sl3n1ZLmBFjNgznbxbUHyT80CeziHFlIGiLBYsF23K4mLiCzh/k5oL9"};
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
