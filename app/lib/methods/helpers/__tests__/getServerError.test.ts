import { getServerError } from '../getServerError';

describe('getServerError', () => {
	it('reads the code, reason and details of a DDP method error', () => {
		expect(
			getServerError({
				error: 'error-avatar-invalid-url',
				reason: 'Invalid avatar URL',
				details: { url: 'https://example.com/a.png' }
			})
		).toEqual({
			code: 'error-avatar-invalid-url',
			reason: 'Invalid avatar URL',
			details: { url: 'https://example.com/a.png' }
		});
	});

	it('reads the code, the message without its code suffix and the details of a REST error', () => {
		expect(
			getServerError({
				data: {
					errorType: 'error-avatar-invalid-url',
					error: 'Invalid avatar URL [error-avatar-invalid-url]',
					details: { url: 'https://example.com/a.png' }
				}
			})
		).toEqual({
			code: 'error-avatar-invalid-url',
			reason: 'Invalid avatar URL',
			details: { url: 'https://example.com/a.png' }
		});
	});
});
