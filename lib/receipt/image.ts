// Downscales a receipt photo and re-encodes it as JPEG before upload or OCR.
// Phone cameras produce 12–48 MP HEIC/JPEG files; 1600px on the long side is plenty
// for reading a receipt and keeps both the network request and tesseract fast.

const JPEG_QUALITY = 0.85;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeWithBitmap(file: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    return null;
  }
}

function decodeWithImageElement(file: Blob): Promise<Decoded | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.onload = () =>
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

/**
 * Returns a JPEG whose longest side is at most `maxSide` pixels.
 * The input blob comes back unchanged when it is already a small JPEG, when the
 * browser cannot decode it, or when we are not in a browser at all.
 */
export async function prepareReceiptImage(file: Blob, maxSide = 1600): Promise<Blob> {
  if (typeof document === "undefined") return file;

  const decoded = (await decodeWithBitmap(file)) ?? (await decodeWithImageElement(file));
  if (!decoded || decoded.width === 0 || decoded.height === 0) return file;

  const longest = Math.max(decoded.width, decoded.height);
  if (longest <= maxSide && file.type === "image/jpeg") {
    decoded.release();
    return file;
  }

  try {
    const scale = Math.min(1, maxSide / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // flatten transparency (PNG screenshots) onto white paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    const out = await canvasToBlob(canvas);
    return out ?? file;
  } catch {
    return file;
  } finally {
    decoded.release();
  }
}
