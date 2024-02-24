export function encodeBytesToBase64String(bytes: Uint8Array) {
  const CHUNK_SIZE = 0x8000;
  const arr = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, [...bytes.subarray(i, i + CHUNK_SIZE)]));
  }
  return btoa(arr.join(''));
}

export function decodeBytesFromBase64String(str: string) {
  // If the base64 string contains '+', but the URL was built carelessly
  // without properly URL-encoding them to %2B, then at this point they
  // may have been replaced by ' '.
  // Turn them back into pluses before decoding from base64.
  str = str.replace(/ /g, '+');

  // We also work with base64url
  str = str.replace(/_/g, '/');
  str = str.replace(/-/g, '+');

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
