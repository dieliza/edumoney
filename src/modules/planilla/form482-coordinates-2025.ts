/**
 * Overlay positions on the original Spanish Hacienda 2025 Formulario 482,
 * Rev. 20 jun 25. PDF points from bottom-left, zero-based source page indices.
 * Geometry only: it does not infer values, compute eligibility, or authorize
 * putting personal data into an export. These anchors must not be reused for
 * another year, language, revision, or printable surrogate.
 */
export type Form482TextPosition = Readonly<{
  page: 0;
  x: number;
  maxX: number;
  y: number;
  maxSize: number;
}>;

export type Form482AmountPosition = Readonly<{
  page: 1 | 2;
  left: number;
  right: number;
  baseline: number;
}>;

export type Form482MarkPosition = Readonly<{ page: 0; x: number; y: number }>;

const text = (x: number, maxX: number, y: number, maxSize = 8): Form482TextPosition =>
  ({ page: 0, x, maxX, y, maxSize });
const dollars = (page: 1 | 2, left: number, right: number, baseline: number): Form482AmountPosition =>
  ({ page, left, right, baseline });
const page2Income = (y: number) => dollars(1, 506, 579, y);
const page2Adjusted = (y: number) => dollars(1, 506, 578, y);
const page3Main = (y: number) => dollars(2, 505, 579, y);
const page3Paid = (y: number) => dollars(2, 425, 488, y);
const mark = (x: number, y: number): Form482MarkPosition => ({ page: 0, x, y });

const demographics = {
  taxpayerFirstName: text(28, 112, 673),
  taxpayerMiddleInitial: text(118, 136, 673),
  taxpayerPaternalSurname: text(141, 217, 673),
  taxpayerMaternalSurname: text(223, 298, 673),
  taxpayerSsn: text(310, 415, 673),
  taxpayerBirthDay: text(308, 325, 645, 7),
  taxpayerBirthMonth: text(330, 349, 645, 7),
  taxpayerBirthYear: text(353, 378, 645, 7),
  mailingAddressLine1: text(28, 298, 648),
  mailingAddressLine2: text(28, 298, 636),
  mailingAddressLine3: text(28, 188, 623),
  mailingPostalCode: text(235, 298, 620, 7),
  spouseFirstName: text(28, 112, 598, 7),
  spouseMiddleInitial: text(118, 135, 598, 7),
  spousePaternalSurname: text(141, 217, 598, 7),
  spouseMaternalSurname: text(223, 299, 598, 7),
  spouseSsn: text(310, 415, 619),
  spouseBirthDay: text(308, 326, 589, 7),
  spouseBirthMonth: text(330, 353, 589, 7),
  spouseBirthYear: text(357, 379, 589, 7),
  residentialAddressLine1: text(28, 297, 574),
  residentialAddressLine2: text(28, 297, 563),
  residentialPostalCode: text(155, 188, 550, 7),
  email: text(117, 299, 535, 7),
  homePhoneArea: text(314, 335, 564.84, 7),
  homePhonePrefix: text(340, 359, 564.84, 7),
  homePhoneLastFour: text(364, 414, 564.84, 7),
  workPhoneArea: text(315, 334, 539.16, 7),
  workPhonePrefix: text(340, 359, 539.16, 7),
  workPhoneLastFour: text(365, 414, 539.16, 7),
  taxpayerOccupation: text(481, 539, 546, 7),
  spouseOccupation: text(481, 539, 534, 7),
} as const;

const amounts = {
  // Page 2, E1. A and B have separate dollar columns; (i) is not (iii).
  '1A-i': dollars(1, 404, 478, 697.08),
  '1B-i': dollars(1, 506, 580, 697.26),
  '1A': dollars(1, 404, 478, 670.98),
  '1B': dollars(1, 506, 580, 670.98),
  '2A': page2Income(579.78), '2B': page2Income(565.8),
  '2C': page2Income(551.81), '2D': page2Income(537.77),
  '2E': page2Income(523.79), '2F': page2Income(509.8),
  '2G': page2Income(495.76), '2H': page2Income(481.78),
  '2I': page2Income(467.8), '2J': page2Income(453.76),
  '2K': page2Income(439.77), '2L': page2Income(411.75),
  '2M': page2Income(397.76), '2N': page2Income(383.78),
  '2O': page2Income(369.74), '2P': page2Income(355.76),
  '2Q': page2Income(341.77), '2R': page2Income(327.73),
  '2S': page2Income(313.75), '2T': page2Income(299.76),
  '3': page2Adjusted(285.72), '4': page2Adjusted(271.74),
  // Page 2, E2: line 8 is not a dollar field; its sublines are distinct.
  '5': page2Adjusted(257.76), '6': page2Adjusted(243.72),
  '7': page2Adjusted(229.73),
  '8A': dollars(1, 427, 491, 216.3),
  '8B': dollars(1, 427, 491, 202.32),
  '8C': page2Adjusted(187.73),
  '9': page2Adjusted(173.75), '10': page2Adjusted(159.71),
  '11': page2Adjusted(145.72), '12': page2Adjusted(131.74),
  '13': page2Adjusted(117.7),
  // Page 3, E3: the five intermediate payments use an inset column.
  '14': page3Main(740.64), '15': page3Main(726.66),
  '16': page3Main(712.62), '17': page3Main(698.63),
  '18': page3Main(684.65), '19': page3Main(670.61),
  '20': page3Main(656.62), '21': page3Main(642.64),
  '22': page3Main(628.6), '23': page3Main(614.62),
  '24': page3Main(600.63), '25': page3Main(586.59),
  '26': page3Main(572.61),
  '27A': page3Paid(546.9), '27B': page3Paid(532.92),
  '27C': page3Paid(518.88), '27D': page3Paid(504.89),
  '27E': page3Paid(490.91), '27F': page3Main(474.62),
  '28': page3Main(460.58), '29': page3Main(446.6),
  '30': page3Main(432.62),
  // Official line 31 is an unsigned figure; refund/payment is not inferred here.
  '31': page3Main(390.62),
} as const;

const marks = {
  usCitizenYes: mark(47.88, 513.45),
  usCitizenNo: mark(65.53, 513.4),
  fullYearPrYes: mark(47.65, 504.9),
  fullYearPrNo: mark(65.3, 504.8),
  filingMarried: mark(344.32, 435.7),
  filingIndividual: mark(344.32, 405.55),
  taxpayerSexM: mark(396.62, 653.05),
  taxpayerSexF: mark(396.55, 645.1),
  spouseSexM: mark(397.13, 598.2),
  spouseSexF: mark(397.05, 590.25),
} as const;

export const FORM_482_2025 = {
  year: 2025,
  revision: '20 jun 25',
  sourceUrl: 'https://hacienda.pr.gov/sites/default/files/individuos_2025_rev._20_jun_25_informativo.pdf',
  sha256: 'c17c5ba0d8c0d2751ed3fe7bcb1b0ed10eb94cdf0129a28c6c056e8229b40761',
  pageSize: { width: 612, height: 792 },
  demographics,
  amounts,
  marks,
} as const;

export type Form482DemographicField = keyof typeof demographics;
export type Form482AmountLine = keyof typeof amounts;
export type Form482Mark = keyof typeof marks;
