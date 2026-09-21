import { getUploadErrorMessage } from './getUploadErrorMessage';

const TRANSLATED = ['error-file-too-large', 'error-too-many-requests'];

jest.mock('~/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string, params?: Record<string, string>) => (params ? `${key}(${JSON.stringify(params)})` : key),
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

	it('translates a server message that is a known key', () => {
		expect(getUploadErrorMessage({ errorStatus: 400, errorMessage: 'error-file-too-large' })).toBe('error-file-too-large');
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
});
