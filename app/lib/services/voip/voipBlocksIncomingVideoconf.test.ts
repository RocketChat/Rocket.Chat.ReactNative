import { voipBlocksIncomingVideoconf } from './voipBlocksIncomingVideoconf';

const mockGetState = jest.fn(() => ({
	call: null as unknown,
	nativeAcceptedCallId: null as string | null
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: () => mockGetState()
	}
}));

describe('voipBlocksIncomingVideoconf', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetState.mockReturnValue({
			call: null,
			nativeAcceptedCallId: null
		});
	});

	it('returns true when VoIP store has an active call', () => {
		mockGetState.mockReturnValue({
			call: { callId: 'voip-1' } as any,
			nativeAcceptedCallId: null
		});
		expect(voipBlocksIncomingVideoconf()).toBe(true);
	});

	it('returns true when nativeAcceptedCallId is set (pending native bind)', () => {
		mockGetState.mockReturnValue({
			call: null,
			nativeAcceptedCallId: 'pending'
		});
		expect(voipBlocksIncomingVideoconf()).toBe(true);
	});

	it('returns false when there is no active VoIP call and no pending native accept', () => {
		expect(voipBlocksIncomingVideoconf()).toBe(false);
	});
});
