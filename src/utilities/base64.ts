export function encodeBytesToBase64String(bytes: Uint8Array) {
  const CHUNK_SIZE = 0x8000;
  const arr = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, [...bytes.subarray(i, i + CHUNK_SIZE)]));
  }
  return btoa(arr.join(''));
}

export function decodeBytesFromBase64String(str: string) {
  let binary;
  try {
    binary = atob(str);
  } catch (ex) {
    throw new TypeError('Invalid base64 sequence', { cause: ex });
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
