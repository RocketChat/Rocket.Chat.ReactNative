import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { getUidDirectMessage } from '../../../../lib/methods/helpers/helpers';
import { useSubscriptionUnreads } from '../useSubscriptionUnreads';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../../lib/methods/helpers/helpers', () => ({ getUidDirectMessage: jest.fn() }));

const mockGet = database.active.get as jest.Mock;
const mockGetUidDirectMessage = getUidDirectMessage as jest.Mock;

type Emit<T> = (value: T) => void;

const setupObservable = () => {
	let emit: Emit<any> | undefined;
	const unsubscribe = jest.fn();
	const subRecord = {
		id: 'sub-1',
		observe: () => ({
			subscribe: (cb: Emit<any>) => {
				emit = cb;
				return { unsubscribe };
			}
		})
	};
	mockGet.mockImplementation(() => ({ find: jest.fn(() => Promise.resolve(subRecord)) }));
	return {
		subRecord,
		unsubscribe,
		emitSub: (sub: any) => act(() => emit?.(sub))
	};
};

const flush = () => act(() => Promise.resolve());

describe('useSubscriptionUnreads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetUidDirectMessage.mockReturnValue(undefined);
	});

	it('maps the subscription observable to the tunread trio and isSelfDm', async () => {
		mockGetUidDirectMessage.mockReturnValue('user-1');
		const observable = setupObservable();
		const { result } = renderHook(() => useSubscriptionUnreads('rid-1', 'user-1'));

		await flush();
		expect(result.current.subscription).toBe(observable.subRecord);

		observable.emitSub({ t: 'd', tunread: ['a', 'b'], tunreadUser: ['a'], tunreadGroup: ['b'] });

		expect(result.current.tunread).toEqual(['a', 'b']);
		expect(result.current.tunreadUser).toEqual(['a']);
		expect(result.current.tunreadGroup).toEqual(['b']);
		expect(result.current.isSelfDm).toBe(true);
	});

	it('does not observe without a rid', async () => {
		setupObservable();
		renderHook(() => useSubscriptionUnreads(undefined, 'user-1'));

		await flush();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('unsubscribes and re-finds when rid changes', async () => {
		const observable = setupObservable();
		const { rerender } = renderHook(({ rid }: { rid: string }) => useSubscriptionUnreads(rid, 'user-1'), {
			initialProps: { rid: 'rid-1' }
		});

		await flush();
		rerender({ rid: 'rid-2' });
		await flush();

		expect(observable.unsubscribe).toHaveBeenCalledTimes(1);
		expect(mockGet).toHaveBeenCalledWith('subscriptions');
	});
});
