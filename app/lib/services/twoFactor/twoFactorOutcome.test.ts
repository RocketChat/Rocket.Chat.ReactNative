import { TwoFactorCancelledError } from './twoFactorCancelled';
import { runCancellableAction } from './twoFactorOutcome';

describe('runCancellableAction', () => {
	it('returns the successful value as completed', async () => {
		await expect(runCancellableAction(() => Promise.resolve('code'))).resolves.toEqual({ status: 'completed', value: 'code' });
	});

	it('returns cancelled for a typed cancellation', async () => {
		await expect(runCancellableAction(() => Promise.reject(new TwoFactorCancelledError()))).resolves.toEqual({
			status: 'cancelled'
		});
	});

	it('rethrows every other error unchanged', async () => {
		const failure = { data: { error: 'error-invalid-password' } };

		await expect(runCancellableAction(() => Promise.reject(failure))).rejects.toBe(failure);
	});
});
