import EJSON from 'ejson';

import dayjs from '../../dayjs';

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- this is the EJSON boundary parser for a server date payload
export const normalizeStatusExpiresAt = (value: unknown): string | undefined => {
	if (!value) return undefined;
	const parsed = EJSON.fromJSONValue(value);
	const d = dayjs(parsed);
	return d.isValid() ? d.toISOString() : undefined;
};
