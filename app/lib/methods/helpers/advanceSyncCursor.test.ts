import database from '../../database';
import log from './log';
import { advanceSyncCursor, maxPayloadUpdatedAt } from './advanceSyncCursor';

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(),
			write: jest.fn()
		}
	}
}));

jest.mock('./log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockGet = database.active.get as jest.Mock;
const mockWrite = database.active.write as jest.Mock;

describe('maxPayloadUpdatedAt', () => {
	it('returns 0 for an empty array', () => {
		expect(maxPayloadUpdatedAt([])).toBe(0);
	});

	it('returns the max _updatedAt as ms across Date, string and number values', () => {
		const expected = new Date('2024-03-01T00:00:00.000Z').getTime();
		const messages = [
			{ _updatedAt: new Date('2024-01-01T00:00:00.000Z') },
			{ _updatedAt: '2024-02-01T00:00:00.000Z' },
			{ _updatedAt: expected }
		];

		expect(maxPayloadUpdatedAt(messages)).toBe(expected);
	});

	it('ignores messages with missing _updatedAt', () => {
		const expected = new Date('2024-01-01T00:00:00.000Z').getTime();
		const messages = [{ _updatedAt: new Date('2024-01-01T00:00:00.000Z') }, {}];

		expect(maxPayloadUpdatedAt(messages)).toBe(expected);
	});
});

describe('advanceSyncCursor', () => {
	const RID = 'room-id';
	let subscription: { lastOpen: Date | null; update: jest.Mock };

	beforeEach(() => {
		jest.clearAllMocks();
		subscription = {
			lastOpen: null,
			update: jest.fn((fn: (s: any) => void) => {
				const model: any = { lastOpen: subscription.lastOpen };
				fn(model);
				subscription.lastOpen = model.lastOpen;
				return Promise.resolve();
			})
		};
		mockGet.mockReturnValue({ find: jest.fn(() => Promise.resolve(subscription)) });
		mockWrite.mockImplementation((cb: () => Promise<void>) => cb());
	});

	it('advances the cursor forward', async () => {
		subscription.lastOpen = new Date('2024-01-01T00:00:00.000Z');
		const candidate = new Date('2024-02-01T00:00:00.000Z').getTime();

		await advanceSyncCursor(RID, candidate);

		expect(subscription.lastOpen?.getTime()).toBe(candidate);
	});

	it('never moves the cursor backwards', async () => {
		const original = new Date('2024-02-01T00:00:00.000Z').getTime();
		subscription.lastOpen = new Date(original);
		const candidate = new Date('2024-01-01T00:00:00.000Z').getTime();

		await advanceSyncCursor(RID, candidate);

		expect(subscription.lastOpen?.getTime()).toBe(original);
		expect(subscription.update).not.toHaveBeenCalled();
	});

	it('is a no-op when the subscription is missing', async () => {
		mockGet.mockReturnValue({ find: jest.fn(() => Promise.reject(new Error('not found'))) });

		await advanceSyncCursor(RID, new Date('2024-01-01T00:00:00.000Z').getTime());

		expect(subscription.update).not.toHaveBeenCalled();
	});

	it('swallows db.write failures and logs them', async () => {
		const error = new Error('write failed');
		mockWrite.mockRejectedValueOnce(error);

		await expect(advanceSyncCursor(RID, new Date('2024-01-01T00:00:00.000Z').getTime())).resolves.toBeUndefined();

		expect(log).toHaveBeenCalledWith(error);
	});
});
