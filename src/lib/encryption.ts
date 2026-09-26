// AES-256-GCM client-side encryption untuk data sensitif kandidat
// Data dienkripsi di browser sebelum dikirim ke server

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV untuk GCM

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(plaintext)
  );

  // Format: salt(16) + iv(12) + ciphertext → base64
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16) as Uint8Array<ArrayBuffer>;
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(password, salt);
  const dec = new TextDecoder();

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext
  );

  return dec.decode(plaintext);
}

// Hash untuk dokumen medis — disimpan hash, bukan file mentah
export async function hashDocument(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Buat identitas anonim untuk kandidat (blind hiring)
export function generateAnonymousId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return '#' + Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// Mask nama untuk tampilan HRD
export function maskIdentity(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(' ');
  const initials = [first[0], ...(rest.length ? [rest[rest.length - 1][0]] : [])].join('');
  return `${initials}****`;
}
