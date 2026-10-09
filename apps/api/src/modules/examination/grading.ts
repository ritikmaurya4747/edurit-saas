import { round2 } from '../../common/utils/money';

// CBSE-style 8-point grade scale used for subject grades, overall grades and
// report cards. Keep this the single source of truth.
export const GRADE_SCALE: { grade: string; min: number }[] = [
  { grade: 'A1', min: 91 },
  { grade: 'A2', min: 81 },
  { grade: 'B1', min: 71 },
  { grade: 'B2', min: 61 },
  { grade: 'C1', min: 51 },
  { grade: 'C2', min: 41 },
  { grade: 'D', min: 33 },
  { grade: 'E', min: 0 },
];

export function gradeFor(percent: number | null | undefined): string | null {
  if (percent == null || Number.isNaN(percent)) return null;
  return (GRADE_SCALE.find((g) => percent >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1]).grade;
}

export const GRADE_REMARKS: Record<string, string> = {
  A1: 'Outstanding performance. Keep up the excellent work!',
  A2: 'Excellent performance. Very consistent effort.',
  B1: 'Very good performance. Can reach the top with a little more effort.',
  B2: 'Good performance. Regular practice will bring further improvement.',
  C1: 'Fair performance. Needs to focus more on weaker subjects.',
  C2: 'Average performance. Needs consistent effort and revision.',
  D: 'Passed. Needs significant improvement and regular study.',
  E: 'Needs improvement. Extra support and dedicated practice are required.',
};

export const autoRemark = (grade: string | null) => (grade ? GRADE_REMARKS[grade] ?? null : null);

export const isAutoRemark = (remarks: string | null | undefined) =>
  !remarks || Object.values(GRADE_REMARKS).includes(remarks);

export const percentOf = (obtained: number, max: number) => (max > 0 ? round2((obtained / max) * 100) : null);
