import { waitUntil } from '../observedEffects';

describe('waitUntil', () => {
	it('resolves once the awaited condition holds', async () => {
		let ready = false;
		setImmediate(() => {
			ready = true;
		});

		await expect(waitUntil(() => ready, { label: 'ready flips', observed: () => ready })).resolves.toBeUndefined();
	});

	it('rejects instead of returning successfully when the condition is never met', async () => {
		const advance = jest.fn(() => Promise.resolve());

		await expect(
			waitUntil(() => false, { label: 'never met', observed: () => ['first-action'], attempts: 3, advance })
		).rejects.toThrow('[waitUntil] "never met" was still false after 3 scheduler advances. Observed: ["first-action"]');
		expect(advance).toHaveBeenCalledTimes(3);
	});
});
