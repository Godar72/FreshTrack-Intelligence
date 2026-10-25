/**
 * frontend/src/lib/auth.ts
 *
 * Cryptographically signed server-side session management using the native Web Crypto API.
 * Compatible with Next.js Middleware (Edge Runtime) and Route Handlers (Node Runtime).
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  store: string;
}

export interface SessionPayload {
  user: SessionUser;
  exp: number; // Unix timestamp in seconds
}

export const SESSION_COOKIE_NAME = "freshtrack_session";

// 8 hours session duration
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const SECRET_KEY =
  process.env.AUTH_SECRET || "freshtrack-intelligence-secure-hmac-sha256-key-production-2026";

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export async function createSessionToken(
  user: SessionUser,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const key = await getHmacKey();
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = base64UrlEncode(signatureBuffer);
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies the cryptographic HMAC-SHA256 signature and expiration of a session token.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [payloadB64, signatureB64] = parts;
  try {
    const key = await getHmacKey();
    const signatureBytes = base64UrlDecode(signatureB64);
    const signatureBuffer = signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength
    ) as ArrayBuffer;
    const dataBuffer = encoder.encode(payloadB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      dataBuffer
    );
    if (!isValid) {
      return null;
    }
    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadJson = decoder.decode(payloadBytes);
    const payload: SessionPayload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Authorized retail operations accounts for Store 1 (Quito).
 * Environment variable overrides can be supplied via AUTH_USER_EMAIL / AUTH_USER_PASSWORD.
 */
export const AUTHORIZED_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: SessionUser;
}> = [
  {
    email: "manager@freshtrack.retail",
    password: "FreshTrack2026!",
    user: {
      id: "usr_store_mgr_01",
      email: "manager@freshtrack.retail",
      name: "Store Operations Manager",
      role: "store_manager",
      store: "Store 1 · Quito",
    },
  },
  {
    email: "supervisor@freshtrack.retail",
    password: "FreshTrack2026!",
    user: {
      id: "usr_perishable_sup_02",
      email: "supervisor@freshtrack.retail",
      name: "Perishable Inventory Supervisor",
      role: "inventory_supervisor",
      store: "Store 1 · Quito",
    },
  },
];

/**
 * Validates credentials on the server side.
 */
export function authenticateCredentials(
  email: string,
  password: string
): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();

  // Environment variable override (optional custom credential in Vercel settings)
  const envEmail = process.env.AUTH_USER_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.AUTH_USER_PASSWORD;
  if (
    envEmail &&
    envPassword &&
    normalizedEmail === envEmail &&
    password === envPassword
  ) {
    return {
      id: "usr_custom_operator",
      email: envEmail,
      name: "Authorized Retail Operator",
      role: "store_operations",
      store: "Store 1 · Quito",
    };
  }

  const account = AUTHORIZED_ACCOUNTS.find(
    (acc) =>
      acc.email.toLowerCase() === normalizedEmail && acc.password === password
  );

  return account ? account.user : null;
}
