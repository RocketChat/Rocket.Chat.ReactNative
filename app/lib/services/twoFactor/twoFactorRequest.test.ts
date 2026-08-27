import { cancelActiveRequest, type ITwoFactorPrompt, subscribeToTwoFactorPrompts, twoFactor } from './twoFactor';
import { isTwoFactorCancelled } from './twoFactorCancelled';
import { isTwoFactorUnavailable } from './twoFactorUnavailable';

describe('two-factor request lifecycle', () => {
	let prompts: ITwoFactorPrompt[];
	let unsubscribe: () => void;

	const request = () => twoFactor({ method: 'totp', invalid: false });

	beforeEach(() => {
		prompts = [];
		unsubscribe = subscribeToTwoFactorPrompts(prompt => prompts.push(prompt));
	});

	afterEach(() => {
		unsubscribe();
	});

	it('cancels the displaced request and keeps the newest one active', async () => {
		const displaced = request();
		const newest = request();

		await expect(displaced.catch(isTwoFactorCancelled)).resolves.toBe(true);

		prompts[1].submit('123456');
		await expect(newest).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
	});

	it('rejects the pending request with a typed cancellation', async () => {
		const pending = request();
		cancelActiveRequest();

		await expect(pending.catch(isTwoFactorCancelled)).resolves.toBe(true);
	});

	it('is harmless when cancelled repeatedly', async () => {
		const pending = request();
		cancelActiveRequest();

		await expect(pending.catch(isTwoFactorCancelled)).resolves.toBe(true);
		expect(() => {
			cancelActiveRequest();
			cancelActiveRequest();
		}).not.toThrow();
	});

	it('is harmless when cancelled after a successful submission', async () => {
		const pending = request();
		prompts[0].submit('123456');

		await expect(pending).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'totp' });

		cancelActiveRequest();
		await expect(pending).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
	});

	it('rejects as unavailable, not cancelled, when no presenter is subscribed', async () => {
		unsubscribe();

		const pending = request();
		const error = await pending.catch(e => e);

		expect(isTwoFactorUnavailable(error)).toBe(true);
		expect(isTwoFactorCancelled(error)).toBe(false);
		expect(prompts).toHaveLength(0);

		unsubscribe = subscribeToTwoFactorPrompts(prompt => prompts.push(prompt));
		expect(prompts).toHaveLength(0);
	});

	it('keeps the pending request alive across a presenter remount', async () => {
		const pending = request();

		unsubscribe();
		unsubscribe = subscribeToTwoFactorPrompts(prompt => prompts.push(prompt));

		await Promise.resolve();

		prompts[0].submit('123456');
		await expect(pending).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
	});
});
