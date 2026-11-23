import { readFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { appendOfficialCT2025 } from '../src/modules/planilla/official-ct-2025';
import { WORK_CREDIT_ELIGIBILITY_KEYS, type WorkCreditInput } from '../src/modules/planilla/year-rules';

const templateUrl = new URL('../assets/tax/2025/schedule-ct-informativo.pdf', import.meta.url);
function input(cents = 1_000_000): WorkCreditInput {
  return {
    taxYear: 2025, filingStatus: 'individual',
    eligibility: Object.fromEntries(WORK_CREDIT_ELIGIBILITY_KEYS.map(key => [key, true])),
    earnedIncome: { cents, verified: true },
    otherIncome: { cents: 0, verified: true },
    qualifiedDependents: { count: 0, verified: true },
  };
}
async function prepare() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  return { pdf, font, template: await readFile(templateUrl) };
}

describe('2025 Spanish official CT draft', () => {
  it('populates the supported entry-band result only when independently matched', async () => {
    const { pdf, template, font } = await prepare();
    const result = await appendOfficialCT2025(pdf, 2025, template, font, input(), 150_000);
    expect(result).toMatchObject({ status: 'populated', confirmation: 'matches', estimatedCreditCents: 150_000 });
    expect(pdf.getPageCount()).toBe(2);
    expect((await PDFDocument.load(await pdf.save())).getPageCount()).toBe(2);
  });

  it('uses the reduction band above its starting threshold', async () => {
    const { pdf, template, font } = await prepare();
    // $19,230 − $19,130 = $100; $1,794 − $15 = $1,779.
    const result = await appendOfficialCT2025(pdf, 2025, template, font, input(1_923_000), 177_900);
    expect(result).toMatchObject({ status: 'populated', confirmation: 'matches', estimatedCreditCents: 177_900 });
  });

  it('leaves the final official cell blank on mismatch or inexact display', async () => {
    const first = await prepare();
    const mismatch = await appendOfficialCT2025(first.pdf, 2025, first.template, first.font, input(), 150_100);
    expect(mismatch).toMatchObject({ status: 'partial', confirmation: 'mismatch' });
    const second = await prepare();
    const inexact = await appendOfficialCT2025(second.pdf, 2025, second.template, second.font, input(1_000_100), 150_015);
    expect(inexact).toMatchObject({ status: 'partial', confirmation: 'matches', estimatedCreditCents: 150_015 });
  });

  it('uses reference only for unverified eligibility and rejects other years/tampering', async () => {
    const { pdf, template, font } = await prepare();
    const blocked = input();
    blocked.eligibility.specialCasesReviewed = false;
    expect(await appendOfficialCT2025(pdf, 2025, template, font, blocked, 150_000))
      .toMatchObject({ status: 'reference', confirmation: 'unavailable', estimatedCreditCents: null });
    await expect(appendOfficialCT2025(pdf, 2026, template, font, input(), 150_000)).rejects.toThrow();
    const tampered = Uint8Array.from(template);
    tampered[0] ^= 1;
    await expect(appendOfficialCT2025(pdf, 2025, tampered, font, input(), 150_000)).rejects.toThrow();
    expect(pdf.getPageCount()).toBe(2);
  });
});
