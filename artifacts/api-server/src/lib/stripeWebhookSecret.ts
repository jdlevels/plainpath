let _secret: string | null = null

export function setWebhookSecret(secret: string): void {
  _secret = secret
}

export function getWebhookSecret(): string | null {
  return _secret
}
