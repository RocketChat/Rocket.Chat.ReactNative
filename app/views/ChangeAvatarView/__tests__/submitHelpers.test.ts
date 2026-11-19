import { handleError } from '../submitHelpers';

describe('handleError', () => {
	it('throws the translated message of a DDP error', () => {
		expect(() => handleError({ error: 'error-not-allowed', reason: 'Permission denied' }, 'changing_avatar')).toThrow(
			new Error('Not allowed')
		);
	});

	it('throws the translated message of a REST error', () => {
		expect(() =>
			handleError(
				{ status: 400, data: { success: false, errorType: 'error-not-allowed', error: 'Permission denied [error-not-allowed]' } },
				'changing_avatar'
			)
		).toThrow(new Error('Not allowed'));
	});

	it('fills the action of a translated error and starts the message with a capital letter', () => {
		expect(() =>
			handleError(
				{
					status: 400,
					data: {
						success: false,
						errorType: 'error-action-not-allowed',
						error: 'Editing a room avatar is not allowed [error-action-not-allowed]',
						details: { method: 'saveRoomSettings', action: 'Editing_room' }
					}
				},
				'changing_avatar'
			)
		).toThrow(new Error('Changing avatar is not allowed'));
	});

	it('fills the url of an invalid avatar URL error', () => {
		expect(() =>
			handleError(
				{
					status: 400,
					data: {
						success: false,
						errorType: 'error-avatar-invalid-url',
						error: 'Invalid avatar URL [error-avatar-invalid-url]',
						details: { url: 'https://example.com/a.png' }
					}
				},
				'changing_avatar'
			)
		).toThrow(new Error('Invalid avatar URL: https://example.com/a.png'));
	});

	it('throws the generic message when a REST error body has no error text', () => {
		expect(() =>
			handleError({ status: 401, data: { status: 'error', message: 'You must be logged in' } }, 'changing_avatar')
		).toThrow('There was an error while changing avatar!');
	});
});
