jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(),
		subscribe: jest.fn()
	}
}));

import { classifySocketHealth } from '../waitForLoginReady';

const now = 1_000_000;

describe('classifySocketHealth', () => {
	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(now);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	function makeDdp(overrides: Record<string, any> = {}) {
		return {
			lastPing: now,
			pingInterval: 10000,
			config: { ping: 10000 },
			...overrides
		};
	}

	it('returns reopen when age > 2 * pingInterval', () => {
		const ddp = makeDdp({ lastPing: now - 21000 });
		expect(classifySocketHealth(ddp)).toBe('reopen');
	});

	it('returns probe when age <= 2 * pingInterval', () => {
		const ddp = makeDdp({ lastPing: now - 15000 });
		expect(classifySocketHealth(ddp)).toBe('probe');
	});

	it('returns probe for a young ping rather than trusting it outright', () => {
		const ddp = makeDdp({ lastPing: now - 5000 });
		expect(classifySocketHealth(ddp)).toBe('probe');
	});

	it('falls back to config.ping when pingInterval is missing', () => {
		// Only a 30s config.ping keeps a 21s-old ping below the reopen threshold.
		const ddp = makeDdp({ pingInterval: undefined, config: { ping: 30000 }, lastPing: now - 21000 });
		expect(classifySocketHealth(ddp)).toBe('probe');
	});

	it('uses 10000ms default when pingInterval and config.ping are missing', () => {
		const ddp = makeDdp({ pingInterval: undefined, config: {}, lastPing: now - 21000 });
		expect(classifySocketHealth(ddp)).toBe('reopen');
	});

	it('returns reopen for a closed socket even when lastPing is fresh', () => {
		const ddp = makeDdp({ connected: false, lastPing: now });
		expect(classifySocketHealth(ddp)).toBe('reopen');
	});
});
