import { isRetryableUploadError } from './isRetryableUploadError';

describe('isRetryableUploadError', () => {
	it.each([[undefined], [0], [200], [408], [429], [500], [502], [503]])('allows a retry for %p', status => {
		expect(isRetryableUploadError(status)).toBe(true);
	});

	it.each([[400], [401], [403], [404], [413], [415], [422]])('refuses a retry for %p', status => {
		expect(isRetryableUploadError(status)).toBe(false);
	});
});
