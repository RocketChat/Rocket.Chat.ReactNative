import EJSON from 'ejson';

import dayjs from '../../dayjs';

export const normalizeStatusExpiresAt = (value: unknown): string | undefined => {
	if (!value) return undefined;
	const parsed = EJSON.fromJSONValue(value);
	const d = dayjs(parsed);
	return d.isValid() ? d.toISOString() : undefined;
};
