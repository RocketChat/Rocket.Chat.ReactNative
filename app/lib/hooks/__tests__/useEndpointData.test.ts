import { act, renderHook } from '@testing-library/react-native';

import sdk from '~/lib/services/sdk';
import { useEndpointData } from '../useEndpointData';

jest.mock('~/lib/services/sdk', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockGet = sdk.get as jest.Mock;

const deferred = () => {
	let resolve!: (value: unknown) => void;
	const promise = new Promise(r => {
		resolve = r;
	});
	return { promise, resolve };
};

describe('useEndpointData', () => {
	it('ignores a response that resolves after a newer request', async () => {
		const first = deferred();
		const second = deferred();
		mockGet.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

		const { result } = renderHook(() => useEndpointData('video-conference.info', { callId: 'c1' }));
		act(() => result.current.reload());

		await act(async () => {
			second.resolve({ success: true, status: 3 });
			await second.promise;
		});
		await act(async () => {
			first.resolve({ success: true, status: 1 });
			await first.promise;
		});

		expect(result.current.result).toEqual({ success: true, status: 3 });
		expect(result.current.loading).toBe(false);
	});
});
