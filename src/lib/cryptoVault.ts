/**
 * Client-Side Zero-Knowledge Cryptographic Vault
 * Implements AES-256-GCM with PBKDF2 (100,000 rounds) using Web Cryptography API.
 * The server and database never receive the encryption key or plaintext.
 */

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

export async function encryptWithVault(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  if (!passphrase) {
    throw new Error('Passphrase is required for vault encryption');
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encryptedBuf),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decryptWithVault(
  ciphertextBase64: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<string> {
  if (!passphrase) {
    throw new Error('Passphrase is required for vault decryption');
  }

  const saltBuf = new Uint8Array(base64ToBuffer(saltBase64));
  const ivBuf = new Uint8Array(base64ToBuffer(ivBase64));
  const encryptedBuf = base64ToBuffer(ciphertextBase64);

  const key = await deriveKey(passphrase, saltBuf);

  try {
    const decryptedBuf = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuf,
      },
      key,
      encryptedBuf
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuf);
  } catch {
    throw new Error('Decryption failed: Invalid passphrase or corrupted ciphertext');
  }
}
