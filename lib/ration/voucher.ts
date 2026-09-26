// Short human-readable voucher codes for Food Bank pledges, e.g. "TW-7K3Q9".
// The alphabet drops 0/O and 1/I so a code read aloud at the counter can't be misheard.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const PREFIX = "TW-";

function randomIndices(count: number): number[] {
  const cryptoObj = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(count);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b % ALPHABET.length);
  }
  return Array.from({ length: count }, () => Math.floor(Math.random() * ALPHABET.length));
}

export function generateVoucherCode(): string {
  const body = randomIndices(CODE_LENGTH)
    .map((i) => ALPHABET[i])
    .join("");
  return `${PREFIX}${body}`;
}
