import { getServerError } from '../getServerError';

describe('getServerError', () => {
	it('reads the code and reason of a DDP method error', () => {
		expect(getServerError({ error: 'error-duplicate-channel-name', reason: 'A channel with name exists' })).toEqual({
			code: 'error-duplicate-channel-name',
			reason: 'A channel with name exists'
		});
	});

	it('reads the code and message of a REST error', () => {
		expect(
			getServerError({
				data: { errorType: 'error-duplicate-channel-name', error: 'A channel with name exists [error-duplicate-channel-name]' }
			})
		).toEqual({
			code: 'error-duplicate-channel-name',
			reason: 'A channel with name exists [error-duplicate-channel-name]'
		});
	});
});
