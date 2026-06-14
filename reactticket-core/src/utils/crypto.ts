export async function deriveKey(pin: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    pin,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return crypto.subtle.importKey("raw", bits, "HMAC", false, ["sign", "verify"]);
}

export async function generateHMAC(key: CryptoKey, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.sign("HMAC", key, encoder.encode(data));
}

export async function signToken(
  header: object,
  payload: object,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${signatureB64}`;
}

export async function verifyToken(token: string, key: CryptoKey): Promise<boolean> {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const data = `${headerB64}.${payloadB64}`;
  const encoder = new TextEncoder();
  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
}
