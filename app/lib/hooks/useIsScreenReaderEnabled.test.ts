import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useIsScreenReaderEnabled } from './useIsScreenReaderEnabled';

describe('useIsScreenReaderEnabled', () => {
	beforeEach(() => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns false initially', () => {
		const { result } = renderHook(() => useIsScreenReaderEnabled());
		expect(result.current).toBe(false);
	});

	it('returns true after isScreenReaderEnabled resolves true', async () => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
		const { result } = renderHook(() => useIsScreenReaderEnabled());
		await act(async () => {});
		expect(result.current).toBe(true);
	});

	it('updates when screenReaderChanged event fires', () => {
		let capturedListener: (enabled: boolean) => void = () => {};
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, cb) => {
			capturedListener = cb as (enabled: boolean) => void;
			return { remove: jest.fn() } as any;
		});

		const { result } = renderHook(() => useIsScreenReaderEnabled());

		act(() => {
			capturedListener(true);
		});

		expect(result.current).toBe(true);
	});

	it('removes the event listener on unmount', () => {
		const removeMock = jest.fn();
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: removeMock } as any);

		const { unmount } = renderHook(() => useIsScreenReaderEnabled());
		unmount();

		expect(removeMock).toHaveBeenCalled();
	});
});
