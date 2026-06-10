import dayjs from '../../dayjs';

// Normalize a message `ts` (Date, ms number, or ISO string — WatermelonDB hands back any of the three
// depending on the read path) to ms since epoch. dayjs parses all three; plain `Number(ts)` / `new
// Date(ts)` each NaN on one of them.
export const tsToMs = (ts: Date | number | string): number => dayjs(ts).valueOf();
