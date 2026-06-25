import dayjs from '../../../lib/dayjs';
import { type ClearAfterValue } from './types';

export const computeExpiresAt = (value: ClearAfterValue, customDate: Date | null): string | null | undefined => {
	if (value === '') return null;
	if (value === '30') return dayjs().add(30, 'minute').toISOString();
	if (value === '60') return dayjs().add(1, 'hour').toISOString();
	if (value === 'custom' && customDate) return dayjs(customDate).toISOString();
	return null;
};

export const getInitialClearAfterState = (
	statusExpiresAt: string | undefined
): { value: ClearAfterValue; customDate: Date | null } => {
	if (!statusExpiresAt) return { value: '', customDate: null };

	const expiresAt = dayjs(statusExpiresAt);
	if (!expiresAt.isValid() || !expiresAt.isAfter(dayjs())) return { value: '', customDate: null };

	return { value: 'custom', customDate: expiresAt.toDate() };
};
