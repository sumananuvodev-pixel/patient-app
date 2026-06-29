const crypto = require('crypto');

// Expect a 32‑byte (256‑bit) key encoded as base64 in ENCRYPTION_KEY
const algorithm = 'aes-256-gcm';
const keyBase64 = process.env.ENCRYPTION_KEY;
if (!keyBase64) {
  throw new Error('ENCRYPTION_KEY environment variable not set');
}
const key = Buffer.from(keyBase64, 'base64');
if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (base64) for AES‑256‑GCM');
}

/**
 * Encrypt a UTF‑8 string and return a base64 string containing:
 *   iv (12 bytes) | authTag (16 bytes) | ciphertext
 */
function encrypt(plainText) {
  const iv = crypto.randomBytes(12); // recommended size for GCM
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Concatenate iv + tag + ciphertext and encode as base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64 string produced by `encrypt`.
 */
function decrypt(enc) {
  const data = Buffer.from(enc, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
