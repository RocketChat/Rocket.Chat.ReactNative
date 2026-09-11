import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { useUnreadsCount } from '../useUnreadsCount';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));

jest.mock('../../../../lib/methods/helpers', () => ({
	__esModule: true,
	isIOS: true
}));

const mockGet = database.active.get as jest.Mock;

type Emit<T> = (value: T) => void;

const setupObservable = () => {
	let emit: Emit<any> | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: Emit<any>) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	mockGet.mockImplementation(() => ({ query: () => ({ observeWithColumns }) }));
	return {
		observeWithColumns,
		unsubscribe,
		emitSubscriptions: (subscriptions: any[]) => act(() => emit?.(subscriptions))
	};
};

describe('useUnreadsCount', () => {
	beforeEach(() => jest.clearAllMocks());

	it('sums the unread count of the observed subscriptions', () => {
		const observable = setupObservable();
		const { result } = renderHook(() => useUnreadsCount('rid-1'));

		expect(result.current).toBeNull();

		observable.emitSubscriptions([{ unread: 3 }, { unread: 2 }]);
		expect(result.current).toBe(5);
	});

	it('excludes subscriptions with no unreads', () => {
		const observable = setupObservable();
		const { result } = renderHook(() => useUnreadsCount('rid-1'));

		observable.emitSubscriptions([{ unread: 4 }, { unread: 0 }]);
		expect(result.current).toBe(4);
	});

	it('excludes subscriptions hiding their unread status', () => {
		const observable = setupObservable();
		const { result } = renderHook(() => useUnreadsCount('rid-1'));

		observable.emitSubscriptions([{ unread: 4 }, { unread: 7, hideUnreadStatus: true }]);
		expect(result.current).toBe(4);
	});

	it('observes every column the count is derived from', () => {
		const observable = setupObservable();
		renderHook(() => useUnreadsCount('rid-1'));

		expect(observable.observeWithColumns).toHaveBeenCalledWith(['unread', 'hide_unread_status']);
	});

	it('does not observe without a rid', () => {
		setupObservable();
		const { result } = renderHook(() => useUnreadsCount(undefined));

		expect(result.current).toBeNull();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('unsubscribes on unmount', () => {
		const observable = setupObservable();
		const { unmount } = renderHook(() => useUnreadsCount('rid-1'));

		unmount();
		expect(observable.unsubscribe).toHaveBeenCalledTimes(1);
	});
});
