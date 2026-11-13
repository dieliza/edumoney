/** Tratamiento determinista de píxeles; no reconstruye letras ni inventa detalle. */
export function receiptContrast(rgba: Uint8ClampedArray, width: number, height: number) {
  if (width * height * 4 !== rgba.length || width <= 0 || height <= 0) throw Error('Dimensiones de imagen no válidas.');
  const gray = new Uint8Array(width * height); let total = 0, dark = 0;
  const sums = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) { let row = 0; for (let x = 0; x < width; x++) { const p = y * width + x, i = p * 4; const v = Math.round(rgba[i] * .299 + rgba[i + 1] * .587 + rgba[i + 2] * .114); gray[p] = v; total += v; if (v < 100) dark++; row += v; sums[(y + 1) * (width + 1) + x + 1] = sums[y * (width + 1) + x + 1] + row; } }
  const output = new Uint8ClampedArray(rgba.length); const radius = Math.max(12, Math.round(width / 32));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const x0 = Math.max(0, x - radius), x1 = Math.min(width, x + radius + 1), y0 = Math.max(0, y - radius), y1 = Math.min(height, y + radius + 1), stride = width + 1;
    const mean = (sums[y1 * stride + x1] - sums[y0 * stride + x1] - sums[y1 * stride + x0] + sums[y0 * stride + x0]) / ((x1 - x0) * (y1 - y0));
    const value = gray[y * width + x] < mean - 9 ? 0 : 255, i = (y * width + x) * 4;
    output[i] = output[i + 1] = output[i + 2] = value; output[i + 3] = 255;
  }
  return { pixels: output, brightness: total / (width * height), darkFraction: dark / (width * height) };
}
export interface ReceiptFragment { text: string; x: number; y: number; height: number; confidence?: number }
export function receiptRows(fragments: readonly ReceiptFragment[]) {
  const rows: { y: number; height: number; fragments: ReceiptFragment[] }[] = [];
  for (const part of [...fragments].filter(p => p.text.trim()).sort((a,b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(r => Math.abs(r.y - part.y) <= Math.max(r.height, part.height) * .55);
    if (row) row.fragments.push(part); else rows.push({ y: part.y, height: part.height, fragments: [part] });
  }
  return rows.map(r => r.fragments.sort((a,b) => a.x - b.x).map(p => p.text.trim()).join('  ')).join('\n');
}
export function receiptReadScore(text: string, confidence: number) {
  const totals = /(?:^|\n)\s*(?:total(?: a pagar)?|grand total|amount due)\b/i.test(text) ? 30 : 0;
  const numbers = Math.min(20, (text.match(/\d+[.,]\d{2}\b/g)?.length ?? 0) * 3);
  return Math.max(0, Math.min(100, confidence)) + totals + numbers;
}

export function chooseReceiptReading(readings: readonly {text:string;confidence:number}[], amounts: readonly string[]) {
  const best = [...readings].sort((a,b) => receiptReadScore(b.text,b.confidence)-receiptReadScore(a.text,a.confidence))[0];
  return { text: best?.text ?? '', confidence: best?.confidence ?? 0, needsAmountReview: new Set(amounts.filter(Boolean)).size > 1 };
}
