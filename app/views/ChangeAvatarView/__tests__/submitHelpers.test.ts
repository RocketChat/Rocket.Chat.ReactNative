import { handleError } from '../submitHelpers';

describe('handleError', () => {
	it('throws the translated message of a DDP error', () => {
		expect(() => handleError({ error: 'error-not-allowed', reason: 'Not allowed' }, 'changing_avatar')).toThrow('Not allowed');
	});

	it('throws the translated message of a REST error', () => {
		expect(() =>
			handleError(
				{ status: 400, data: { success: false, errorType: 'error-not-allowed', error: 'Not allowed [error-not-allowed]' } },
				'changing_avatar'
			)
		).toThrow(new Error('Not allowed'));
	});

	it('fills the action of a translated error with the action being done', () => {
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
		).toThrow(new Error('changing avatar is not allowed'));
	});

	it('throws the generic message when a REST error body has no error text', () => {
		expect(() =>
			handleError({ status: 401, data: { status: 'error', message: 'You must be logged in' } }, 'changing_avatar')
		).toThrow('There was an error while changing avatar!');
	});
});
