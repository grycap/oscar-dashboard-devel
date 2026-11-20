// Prefer the lifetime supplied with the token response. For older sessions,
// a JWT can provide the original lifetime through exp - iat; opaque tokens cannot.
export function getRefreshTokenLifetime(token: string, lifetimeSeconds?: number): number | undefined {
  if (typeof lifetimeSeconds === "number" && Number.isSafeInteger(lifetimeSeconds) && lifetimeSeconds > 0) {
    return lifetimeSeconds;
  }

  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const { exp, iat } = payload;
    const lifetime = exp - iat;
    return Number.isSafeInteger(exp) && Number.isSafeInteger(iat) && Number.isSafeInteger(lifetime) && lifetime > 0
      ? lifetime : undefined;
  } catch {
    return undefined;
  }
}

export function formatTokenLifetime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [
    ...(days ? [`${days}d`] : []),
    ...(days || hours ? [`${hours}h`] : []),
    ...(days || hours || minutes ? [`${minutes}m`] : []),
    ...(secs || (!days && !hours && !minutes) ? [`${secs}s`] : []),
  ].join(" ");
}
