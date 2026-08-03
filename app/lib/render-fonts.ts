import { readFile } from "node:fs/promises";

const fontDirectory = new URL(
  "../assets/fonts/og/",
  import.meta.url,
);

const [instrumentSerifBytes, notoSerifScBytes] = await Promise.all([
  readFile(new URL("InstrumentSerif-Regular.ttf", fontDirectory)),
  readFile(new URL("NotoSerifSC-Regular.ttf", fontDirectory)),
]);

export const RENDER_FONT_DATA = {
  instrumentSerif: toArrayBuffer(instrumentSerifBytes),
  notoSerifSc: toArrayBuffer(notoSerifScBytes),
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
