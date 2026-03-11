export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://cloud.umami.is https://cdn.jsdelivr.net https://giscus.app",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://cloud.umami.is https://api.web3forms.com https://giscus.app https://*.github.com",
  "frame-src https://giscus.app",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
} as const;
