import type { NextConfig } from "next";

// Minimal, non-breaking hardening. No CSP: Tesseract's worker/wasm/lang data load from
// cdn.jsdelivr.net at runtime and fonts come from Google. camera=(self) keeps the scan
// page's <input capture="environment"> working; nothing embeds the PWA, so framing is denied.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
