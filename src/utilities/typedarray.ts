export function concatUint8Arrays(...arrays: Uint8Array[]) {

  const combinedBuffer = new Uint8Array(arrays.reduce((acc, seg) => acc + seg.length, 0));
  let offset = 0;
  for (const item of arrays) {
    combinedBuffer.set(item, offset);
    offset = offset + item.length;
  }

  return combinedBuffer;
}
