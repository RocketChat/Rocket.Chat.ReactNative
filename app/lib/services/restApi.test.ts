import type { ServerMediaSignal } from '@rocket.chat/media-signaling';

import { mediaCallsStateSignals } from './restApi';

const mockSdkGet = jest.fn();
jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockSdkGet(...args)
	}
}));

describe('mediaCallsStateSignals', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls sdk.get with media-calls.stateSignals and the contractId', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: [], success: true });

		const result = await mediaCallsStateSignals('device-contract-id-123');

		expect(mockSdkGet).toHaveBeenCalledWith('media-calls.stateSignals', { contractId: 'device-contract-id-123' });
		expect(result).toEqual({ signals: [], success: true });
	});

	it('returns signals and success from the API response', async () => {
		const mockSignals = [
			{ type: 'new', callId: 'call-1' } as unknown as ServerMediaSignal,
			{ type: 'notification', notification: 'ringing' } as unknown as ServerMediaSignal
		];
		mockSdkGet.mockResolvedValueOnce({ signals: mockSignals, success: true });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toHaveLength(2);
		expect(result.success).toBe(true);
	});

	it('returns empty signals and success false when sdk.get throws', async () => {
		mockSdkGet.mockRejectedValueOnce(new Error('Network error'));

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toEqual([]);
		expect(result.success).toBe(false);
	});

	it('returns empty signals and success false when sdk.get returns an error response', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: [], success: false });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toEqual([]);
		expect(result.success).toBe(false);
	});

	it('returns empty signals and success false when signals is not an array', async () => {
		mockSdkGet.mockResolvedValueOnce({ signals: null, success: true });

		const result = await mediaCallsStateSignals('device-id');

		expect(result.signals).toEqual([]);
		expect(result.success).toBe(false);
	});
});
