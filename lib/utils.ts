export async function encrypt(text: string, base64Key: string) {
  const encoder = new TextEncoder();
  const keyData = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    keyData.buffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // unique per encryption
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text),
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined)); // base64 for storage
}

// Decrypt text with AES-GCM
export async function decrypt(base64Cipher: string, base64Key: string) {
  const decoder = new TextDecoder();
  const data = Uint8Array.from(atob(base64Cipher), (c) => c.charCodeAt(0));
  const keyData = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));

  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData.buffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return decoder.decode(decrypted);
}
