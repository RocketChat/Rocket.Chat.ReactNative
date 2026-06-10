import dayjs from '../../dayjs';

export const normalizeStatusExpiresAt = (value: any): string | undefined => {
	if (!value) return undefined;
	if (typeof value === 'object' && value.$date) {
		const d = dayjs(value.$date);
		return d.isValid() ? d.toISOString() : undefined;
	}
	const d = dayjs(value);
	return d.isValid() ? d.toISOString() : undefined;
};
