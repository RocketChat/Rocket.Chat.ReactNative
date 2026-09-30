import { getUploadErrorMessage } from './getUploadErrorMessage';

const TRANSLATED = ['error-file-too-large', 'error-too-many-requests', 'toString'];

jest.mock('~/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string, params?: Record<string, string>) => {
			if (key === 'toString') {
				return (() => undefined) as unknown as string;
			}
			return params ? `${key}(${JSON.stringify(params)})` : key;
		},
		isTranslated: (text?: string) => TRANSLATED.includes(text ?? '')
	}
}));

describe('getUploadErrorMessage', () => {
	it('explains a 413 without relying on the server', () => {
		expect(getUploadErrorMessage({ errorStatus: 413 })).toBe('error-file-too-large');
	});

	it('prefers our own copy over the server message for a known status', () => {
		expect(getUploadErrorMessage({ errorStatus: 413, errorMessage: 'Entity too large' })).toBe('error-file-too-large');
	});

	it('returns nothing when the failure has no status and no message', () => {
		expect(getUploadErrorMessage({})).toBeUndefined();
		expect(getUploadErrorMessage({ errorStatus: 500 })).toBeUndefined();
	});

	it('falls back to a generic notice for a permanent failure with no usable message', () => {
		expect(getUploadErrorMessage({ errorStatus: 405 })).toBe('FileUpload_Error');
		expect(getUploadErrorMessage({ errorStatus: 400, errorMessage: '' })).toBe('FileUpload_Error');
	});

	it('stays quiet for a retryable failure with no usable message', () => {
		expect(getUploadErrorMessage({ errorStatus: 429 })).toBeUndefined();
		expect(getUploadErrorMessage({ errorStatus: 503, errorMessage: '' })).toBeUndefined();
	});

	it('translates a server message that is a known key', () => {
		expect(getUploadErrorMessage({ errorStatus: 400, errorMessage: 'error-file-too-large' })).toBe('error-file-too-large');
	});

	it('translates an oversize sentence carrying the key', () => {
		expect(
			getUploadErrorMessage({ errorStatus: 400, errorMessage: 'File size exceeds the allowed limit [error-file-too-large]' })
		).toBe('error-file-too-large');
	});

	it('shows an unknown server message as it came', () => {
		expect(getUploadErrorMessage({ errorStatus: 507, errorMessage: 'Storage quota exceeded' })).toBe('Storage quota exceeded');
	});

	it('pulls the wait out of a rate limit sentence', () => {
		expect(
			getUploadErrorMessage({
				errorStatus: 429,
				errorMessage: 'Error, too many requests. You must wait 37 seconds before trying again. [error-too-many-requests]'
			})
		).toBe('error-too-many-requests({"seconds":"37"})');
	});

	it('does not let unrelated digits in the message corrupt the wait time', () => {
		expect(
			getUploadErrorMessage({
				errorStatus: 429,
				errorMessage: 'Error 42: too many requests. You must wait 5 seconds before trying again. [error-too-many-requests]'
			})
		).toBe('error-too-many-requests({"seconds":"5"})');
	});

	it('shows no reason when a rate limit message carries no wait to interpolate', () => {
		expect(getUploadErrorMessage({ errorStatus: 429, errorMessage: 'error-too-many-requests' })).toBeUndefined();
		expect(getUploadErrorMessage({ errorStatus: 429, errorMessage: '[error-too-many-requests]' })).toBeUndefined();
	});

	it('never returns a non-string for a server message that shadows an object prototype key', () => {
		expect(getUploadErrorMessage({ errorStatus: 500, errorMessage: 'toString' })).toBe('toString');
	});
});
