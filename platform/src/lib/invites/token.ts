export async function generateInviteToken(): Promise<{
  rawToken: string;
  tokenHash: string;
}> {
  // 32 bytes = 256 bits of entropy
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const rawToken = Array.from(raw)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawToken));
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { rawToken, tokenHash };
}

export function buildInviteUrl(rawToken: string, baseUrl = window.location.origin): string {
  return `${baseUrl}/invite/${rawToken}`;
}
