import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { isInActiveVoipCall } from './isInActiveVoipCall';
import type { PreBindStatus } from './CallLifecycle';

type CallStoreSlice = {
	call: IClientMediaCall | null;
};

const mockGetState = jest.fn(
	(): CallStoreSlice => ({
		call: null
	})
);

// Mock callLifecycle.preBindStatus separately so we can control it per-test
const mockPreBindStatus = jest.fn((): PreBindStatus => ({ kind: 'idle' }));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: () => mockGetState()
	}
}));

jest.mock('./CallLifecycle', () => ({
	callLifecycle: {
		preBindStatus: () => mockPreBindStatus(),
		emitter: {
			on: jest.fn(() => jest.fn()),
			off: jest.fn()
		}
	}
}));

describe('isInActiveVoipCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetState.mockReturnValue({ call: null });
		mockPreBindStatus.mockReturnValue({ kind: 'idle' as const });
	});

	it('returns true when useCallStore has an active call', () => {
		const activeCall = { callId: 'voip-1' } as unknown as IClientMediaCall;
		mockGetState.mockReturnValue({ call: activeCall });
		expect(isInActiveVoipCall()).toBe(true);
	});

	it('returns true when lifecycle.preBindStatus is awaitingMediaCall (pending native bind)', () => {
		mockPreBindStatus.mockReturnValue({ kind: 'awaitingMediaCall', uuid: 'pending', host: 'h', cleanupAt: Date.now() + 60_000 });
		expect(isInActiveVoipCall()).toBe(true);
	});

	it('returns false when there is no active call and preBindStatus is idle', () => {
		expect(isInActiveVoipCall()).toBe(false);
	});

	it('returns false when preBindStatus is failed (transient — observable only via preBindFailed event)', () => {
		mockPreBindStatus.mockReturnValue({ kind: 'failed', uuid: 'x', reason: 'cleanup' as const });
		expect(isInActiveVoipCall()).toBe(false);
	});
});
