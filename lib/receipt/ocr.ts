// Free, on-device receipt OCR with tesseract.js (Arabic + English).
// The worker is created once per page session and reused; tesseract.js itself is
// dynamically imported so it never lands in the initial bundle.
import type { Worker } from "tesseract.js";

/**
 * Pinned to the versions installed in node_modules (tesseract.js 7.0.0 depends on
 * tesseract.js-core 7.0.0). We point the worker and the WebAssembly core at jsDelivr
 * instead of letting the bundler chase them: Next/Turbopack cannot see the
 * `new Worker(...)` + `importScripts(...)` chain inside tesseract.js, so bundling the
 * worker script and the ~4 MB wasm variants would either break or bloat the build.
 * The CDN also serves them with long cache headers, so the second scan is instant.
 *
 * corePath is a directory on purpose: the worker probes SIMD / relaxed-SIMD support
 * and picks the fastest `tesseract-core-*-lstm.wasm.js` inside it, which a single
 * pinned file would not do (older iPhones lack SIMD).
 */
const TESSERACT_VERSION = "7.0.0";
const TESSERACT_CORE_VERSION = "7.0.0";
const WORKER_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/worker.min.js`;
const CORE_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT_CORE_VERSION}`;

/**
 * langPath is deliberately left to the library default. Since v5 the default is
 * `https://cdn.jsdelivr.net/npm/@tesseract.js-data/<lang>/4.0.0_best_int`, which is
 * per-language and integer-quantised (ara ≈ 1.5 MB, eng ≈ 4 MB gzipped). A single
 * langPath cannot express that per-language layout, and the legacy
 * `tessdata.projectnaptha.com/4.0.0` bundle is 2–3× larger on a phone connection.
 */
const LANGS = "ara+eng";
const RECOGNIZING = "recognizing text";

let workerPromise: Promise<Worker> | null = null;
let onProgressRef: ((percent: number) => void) | null = null;
let queue: Promise<unknown> = Promise.resolve();

function getWorker(): Promise<Worker> {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const { createWorker, OEM } = await import("tesseract.js");
    const worker = await createWorker(LANGS, OEM.LSTM_ONLY, {
      workerPath: WORKER_PATH,
      corePath: CORE_PATH,
      logger: (m) => {
        if (m.status === RECOGNIZING && onProgressRef) {
          onProgressRef(Math.max(0, Math.min(100, Math.round(m.progress * 100))));
        }
      },
    });
    // Receipts are columns of text: keeping the real gaps makes "5 كجم ×7" parse cleanly.
    await worker.setParameters({ preserve_interword_spaces: "1" });
    return worker;
  })().catch((error: unknown) => {
    workerPromise = null; // let the next attempt retry after a network hiccup
    throw error;
  });
  return workerPromise;
}

/**
 * Runs OCR on a receipt image and returns the raw text (lines separated by "\n").
 * `onProgress` receives 0..100 while tesseract recognises the page.
 * Throws when the worker, core or language data cannot be loaded (e.g. offline).
 */
export function recognizeReceiptText(image: Blob, onProgress?: (percent: number) => void): Promise<string> {
  const run = async (): Promise<string> => {
    const worker = await getWorker();
    onProgressRef = onProgress ?? null;
    try {
      onProgress?.(0);
      const { data } = await worker.recognize(image);
      onProgress?.(100);
      return data.text ?? "";
    } finally {
      onProgressRef = null;
    }
  };
  // One recognition at a time so progress callbacks never cross between two scans.
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

/** Frees the OCR worker (≈ 30–60 MB of wasm heap). Safe to call when none exists. */
export async function disposeOcr(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (!pending) return;
  try {
    const worker = await pending;
    await worker.terminate();
  } catch {
    // The worker never came up; nothing to free.
  }
}
