export function resolveJwtSecret(configured: string | undefined): string {
  if (!configured || configured.length < 32) {
    throw new Error('JWT_SECRET must be configured with a strong secret');
  }
  return configured;
}
