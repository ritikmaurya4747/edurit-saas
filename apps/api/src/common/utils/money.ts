import { Prisma } from '@edurit/database';

type Numeric = Prisma.Decimal | number | string | null | undefined;

export const toNumber = (value: Numeric): number => (value == null ? 0 : Number(value));

// Round to 2 decimals for currency maths done in JS.
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const decimal = (value: number | string): Prisma.Decimal => new Prisma.Decimal(value);
