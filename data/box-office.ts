// data/box-office.ts
import type { BoxOffice } from '@/lib/types';

export const boxOffice: BoxOffice = {
  weekend: 'Apr 18 – 20, 2026',
  rows: [
    { rank: 1, title: 'Mickey 17',      weekend: 28_400_000, total: 92_100_000, weeks: 2, change: -42, theaters: 3850, perTheater: 7376, budget: 118_000_000 },
    { rank: 2, title: 'A Real Pain',    weekend: 18_200_000, total: 18_200_000, weeks: 1, change: null, theaters: 2945, perTheater: 6180, budget: 17_000_000, isNew: true },
    { rank: 3, title: 'The Brutalist',  weekend:  9_800_000, total: 41_200_000, weeks: 6, change: -28, theaters: 1820, perTheater: 5384, budget:  9_600_000 },
    { rank: 4, title: 'Companion',      weekend:  7_100_000, total: 32_400_000, weeks: 4, change: -34, theaters: 2210, perTheater: 3213, budget: 10_000_000 },
    { rank: 5, title: 'Conclave',       weekend:  4_200_000, total: 28_800_000, weeks: 5, change: -19, theaters: 1430, perTheater: 2937, budget: 20_000_000 },
    { rank: 6, title: 'Nosferatu',      weekend:  3_100_000, total: 91_400_000, weeks: 8, change: -22, theaters:  980, perTheater: 3163, budget: 50_000_000 },
    { rank: 7, title: 'Anora',          weekend:  2_400_000, total: 18_900_000, weeks: 7, change: -47, theaters: 1180, perTheater: 2034, budget:  6_000_000 },
    { rank: 8, title: 'The Substance',  weekend:  1_100_000, total: 47_200_000, weeks: 12, change: -8, theaters:  540, perTheater: 2037, budget: 17_500_000 },
  ],
};
