import { renderHook } from '@testing-library/react-native';

import { useWarmUpMessageBlocks } from '../useWarmUpMessageBlocks';
import { warmUpMessageBlocks } from '~/containers/UIKit/warmUpMessageBlocks';

jest.mock('~/containers/UIKit/warmUpMessageBlocks', () => ({ warmUpMessageBlocks: jest.fn() }));

describe('useWarmUpMessageBlocks', () => {
	const idleCallbacks = new Map<number, () => void>();

	beforeEach(() => {
		idleCallbacks.clear();
		let nextHandle = 1;
		global.requestIdleCallback = jest.fn(callback => {
			idleCallbacks.set(nextHandle, callback as () => void);
			return nextHandle++;
		});
		global.cancelIdleCallback = jest.fn(handle => idleCallbacks.delete(handle));
		jest.mocked(warmUpMessageBlocks).mockClear();
	});

	it('warms up message blocks once the JS thread is idle', () => {
		renderHook(() => useWarmUpMessageBlocks());
		expect(warmUpMessageBlocks).not.toHaveBeenCalled();

		idleCallbacks.forEach(callback => callback());

		expect(warmUpMessageBlocks).toHaveBeenCalledTimes(1);
	});

	it('skips the warm-up when the rooms list unmounts before idle', () => {
		const { unmount } = renderHook(() => useWarmUpMessageBlocks());
		unmount();

		idleCallbacks.forEach(callback => callback());

		expect(warmUpMessageBlocks).not.toHaveBeenCalled();
	});
});
