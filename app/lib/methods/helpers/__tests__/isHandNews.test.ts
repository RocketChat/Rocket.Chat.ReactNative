import { isHandNews } from '../isHandNews';

describe('isHandNews', () => {
	it('is news when a hand goes up that was down', () => {
		expect(isHandNews({ type: 'hand', raised: true }, false)).toBe(true);
	});

	it('is not news when the hand was already up', () => {
		expect(isHandNews({ type: 'hand', raised: true }, true)).toBe(false);
	});

	it('is not news when the hand is only repeated for someone who just arrived', () => {
		expect(isHandNews({ type: 'hand', raised: true, rebroadcast: true }, false)).toBe(false);
	});

	it('is not news when a hand goes down', () => {
		expect(isHandNews({ type: 'hand', raised: false }, true)).toBe(false);
		expect(isHandNews({ type: 'hand', raised: false }, false)).toBe(false);
	});
});
