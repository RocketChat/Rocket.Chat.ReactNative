import { claimInlineTextPress, hasInlineTextPressClaim, releaseInlineTextPress } from './inlineTextPressClaim';

describe('inlineTextPressClaim', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		releaseInlineTextPress();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('reports no claim before any press', () => {
		expect(hasInlineTextPressClaim()).toBe(false);
	});

	it('reports a claim while inline text owns the touch', () => {
		claimInlineTextPress();

		expect(hasInlineTextPressClaim()).toBe(true);
	});

	it('holds the claim past the long press delay so the row can still be suppressed', () => {
		claimInlineTextPress();
		jest.advanceTimersByTime(500);

		expect(hasInlineTextPressClaim()).toBe(true);
	});

	it('drops the claim once the press is released', () => {
		claimInlineTextPress();
		releaseInlineTextPress();

		expect(hasInlineTextPressClaim()).toBe(false);
	});

	it('expires a claim that was never released, so a missed release cannot wedge long press', () => {
		claimInlineTextPress();
		jest.advanceTimersByTime(1000);

		expect(hasInlineTextPressClaim()).toBe(false);
	});

	it('re-claims cleanly on a subsequent press', () => {
		claimInlineTextPress();
		jest.advanceTimersByTime(1000);
		claimInlineTextPress();

		expect(hasInlineTextPressClaim()).toBe(true);
	});
});
