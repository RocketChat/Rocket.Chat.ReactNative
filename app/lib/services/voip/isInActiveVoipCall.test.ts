import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { isInActiveVoipCall } from './isInActiveVoipCall';

type CallStoreSlice = {
	call: IClientMediaCall | null;
	nativeAcceptedCallId: string | null;
};

const mockGetState = jest.fn(
	(): CallStoreSlice => ({
		call: null,
		nativeAcceptedCallId: null
	})
);

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: () => mockGetState()
	}
}));

describe('isInActiveVoipCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetState.mockReturnValue({
			call: null,
			nativeAcceptedCallId: null
		});
	});

	it('returns true when useCallStore has an active call', () => {
		const activeCall = { callId: 'voip-1' } as unknown as IClientMediaCall;
		mockGetState.mockReturnValue({
			call: activeCall,
			nativeAcceptedCallId: null
		});
		expect(isInActiveVoipCall()).toBe(true);
	});

	it('returns true when nativeAcceptedCallId is set (pending native bind)', () => {
		mockGetState.mockReturnValue({
			call: null,
			nativeAcceptedCallId: 'pending'
		});
		expect(isInActiveVoipCall()).toBe(true);
	});

	it('returns false when there is no active call and no pending native accept', () => {
		expect(isInActiveVoipCall()).toBe(false);
	});
});
