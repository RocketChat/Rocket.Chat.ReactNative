import { act, renderHook } from '@testing-library/react-native';

import { useCanTakeOverCall } from './useCanTakeOverCall';

type Listener = () => void;

const mockStoreListeners = new Set<Listener>();
let mockInstance: { canTakeOverCall: jest.Mock; on: jest.Mock; listeners: Set<Listener> } | null = null;

const createInstance = (canTakeOver: boolean) => {
	const listeners = new Set<Listener>();
	return {
		listeners,
		canTakeOverCall: jest.fn(() => canTakeOver),
		on: jest.fn((_event: string, listener: Listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		})
	};
};

jest.mock('./MediaSessionStore', () => ({
	mediaSessionStore: {
		getCurrentInstance: () => mockInstance,
		onChange: (listener: Listener) => {
			mockStoreListeners.add(listener);
			return () => mockStoreListeners.delete(listener);
		}
	}
}));

describe('useCanTakeOverCall', () => {
	beforeEach(() => {
		mockStoreListeners.clear();
		mockInstance = null;
	});

	it('is false without a media session', () => {
		const { result } = renderHook(() => useCanTakeOverCall());

		expect(result.current).toBe(false);
	});

	it('follows the session state', () => {
		const instance = createInstance(false);
		mockInstance = instance;
		const { result } = renderHook(() => useCanTakeOverCall());
		expect(result.current).toBe(false);

		instance.canTakeOverCall.mockReturnValue(true);
		act(() => instance.listeners.forEach(listener => listener()));

		expect(instance.on).toHaveBeenCalledWith('sessionStateChange', expect.any(Function));
		expect(result.current).toBe(true);
	});

	it('follows a session created after mount', () => {
		const { result } = renderHook(() => useCanTakeOverCall());

		act(() => {
			mockInstance = createInstance(true);
			mockStoreListeners.forEach(listener => listener());
		});

		expect(result.current).toBe(true);
	});

	it('stops listening on unmount', () => {
		const instance = createInstance(false);
		mockInstance = instance;
		const { unmount } = renderHook(() => useCanTakeOverCall());

		unmount();

		expect(instance.listeners.size).toBe(0);
		expect(mockStoreListeners.size).toBe(0);
	});
});
