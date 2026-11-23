import { describe, expect, it } from 'vitest';
import {
  calculateForm4822025, type Form482ConfirmedField2025, type Form482Input2025,
} from '../src/modules/planilla/form482-calculation-2025';

const baseline: Form482Input2025 = {
  taxYear: 2025, fullYearResident: true, filingStatus: 'individual',
  method: 'regular-table', casesReviewed: true,
};
function values(patch: Partial<Record<Form482ConfirmedField2025, number | null>> = {}) {
  return {
    '5': 28000, '6': 0, '8A': 0, '8B': 0, '9': 0, '12': 0, '18': 0,
    '20': 0, '21': 0, '24': 0, '25': 0, '27A': 1000, '27B': 0,
    '27C': 0, '27D': 0, '27E': 0, '30': 0, grossFor17: 28000,
    ...patch,
  };
}

describe('Formulario 482 2025: draft whole-dollar arithmetic', () => {
  it('tracks Form 482 dollars, official ovals and explicit fractional line convention', () => {
    const result = calculateForm4822025({ ...baseline, confirmedDollars: values() });
    expect(result.lines).toMatchObject({
      '7': 3500, '8C': 0, '10': 3500, '11': 24500, '13': 24500, '14': 1085,
      '15': 0, '16': 1085, '17': 998, '23': 0, '26': 998, '27F': 1000,
      '28': 0, '29': 2, '31': 2,
    });
    expect(result).toMatchObject({
      pending: [], line14Oval: 1, line17Oval: 2, line17Percent: 92,
      truncatedLines: ['17'], balance: { type: 'overpayment', dollars: 2 }, filingReady: false,
    });
  });

  it('preserves regular bracket joins and distinguishes the separate gross threshold basis', () => {
    const expected = [[9000, 0], [9001, 0], [25000, 1120], [25010, 1121],
      [41500, 3430], [41504, 3431], [61500, 8430], [61504, 8431]];
    for (const [net, line14] of expected) {
      const r = calculateForm4822025({ ...baseline, confirmedDollars: values({ '5': net + 3500 }) });
      expect(r.lines['14']).toBe(line14);
      if (net === 9001) expect(r.truncatedLines).toContain('14');
    }
    const boundary = calculateForm4822025({ ...baseline, confirmedDollars: values({ grossFor17: 100000 }) });
    const above = calculateForm4822025({ ...baseline, confirmedDollars: values({ grossFor17: 100001 }) });
    expect([boundary.line17Oval, boundary.lines['17'], above.line17Oval, above.lines['17']])
      .toEqual([2, 998, 1, 1030]);
  });

  it('does not promote unknown, fractional, negative or invalid exemption values to zeros', () => {
    const r = calculateForm4822025({
      ...baseline, confirmedDollars: values({ grossFor17: null, '8A': 100, '27B': 7.75, '27C': -1 }),
    });
    expect(r.pending).toEqual(expect.arrayContaining([
      { line: 'grossFor17', reason: 'unconfirmed-input' },
      { line: '8A', reason: 'invalid-confirmed-exemption' },
      { line: '27B', reason: 'invalid-whole-dollar-input' },
      { line: '27C', reason: 'invalid-whole-dollar-input' },
    ]));
    expect(r.lines['13']).toBeUndefined();
    expect(r.lines['27F']).toBeUndefined();
    expect(r.balance).toBeNull();
  });

  it('adds confirmed adjustments, compares paid amounts and offsets the estimated-payment addition', () => {
    const r = calculateForm4822025({ ...baseline, confirmedDollars: values({
      '18': 100, '20': 50, '24': 20, '25': 30,
      '27A': 500, '27B': 100, '27C': 300, '27D': 50, '27E': 20, '30': 40,
    }) });
    expect(r.lines).toMatchObject({ '19': 898, '22': 948, '26': 938, '27F': 970, '28': 0, '29': 32, '31': 8 });
    expect(r.balance).toEqual({ type: 'payment', dollars: 8 });
  });

  it('blocks the gradual adjustment, alternative-tax inconsistencies and incompatible scopes', () => {
    const high = calculateForm4822025({ ...baseline, confirmedDollars: values({ '5': 503501, grossFor17: 503501 }) });
    expect(high.pending).toContainEqual({ line: '15', reason: 'gradual-adjustment-required' });
    expect(high.lines['17']).toBeUndefined();
    expect(high.balance).toBeNull();

    const contradictory = calculateForm4822025({ ...baseline, confirmedDollars: values({ '20': 50, '21': 10 }) });
    expect(contradictory.pending).toContainEqual({ line: '21', reason: 'incompatible-alternative-tax-lines' });
    expect(contradictory.balance).toBeNull();

    const newer = calculateForm4822025({ ...baseline, taxYear: 2026, confirmedDollars: values() });
    expect(newer.pending).toEqual([{ line: 'scope', reason: 'unsupported-year' }]);
    expect(newer.lines).toEqual({});
    const optional = calculateForm4822025({ ...baseline, method: 'optional', confirmedDollars: values() });
    expect(optional.pending).toEqual([{ line: 'scope', reason: 'unsupported-method' }]);
    expect(optional.lines['23']).toBeUndefined();
  });

  it('floors deductions and liabilities at zero without changing the original confirmed inputs', () => {
    const r = calculateForm4822025({ ...baseline, confirmedDollars: values({
      '5': 6000, '6': 600, '8A': 2500, '8B': 1250, '9': 1500, '12': 0,
      '25': 20, '27A': 0, grossFor17: 6000,
    }) });
    expect(r.lines).toMatchObject({ '8C': 3750, '10': 9350, '11': 0, '12': 0, '13': 0, '26': 0, '31': 0 });
    expect(r.balance).toEqual({ type: 'zero', dollars: 0 });
    const overstated = calculateForm4822025({ ...baseline, confirmedDollars: values({ '12': 7351 }) });
    expect(overstated.pending).toContainEqual({ line: '12', reason: 'private-capital-exceeds-maximum' });
    expect(overstated.balance).toBeNull();
  });
});
