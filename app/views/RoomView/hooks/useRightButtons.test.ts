import { act, renderHook } from '@testing-library/react-native';

import database from '../../../lib/database';
import { hasPermission } from '../../../lib/methods/helpers';
import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { useRightButtons } from './useRightButtons';
import { type IUseRightButtonsParams } from '../definitions';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../lib/methods/helpers', () => ({ hasPermission: jest.fn(() => Promise.resolve([false])) }));
jest.mock('../../../lib/methods/helpers/helpers', () => ({ getUidDirectMessage: jest.fn() }));

const mockGet = database.active.get as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;
const mockGetUidDirectMessage = getUidDirectMessage as jest.Mock;

type Emit<T> = (value: T) => void;

const setupObservables = () => {
	let threadEmit: Emit<any> | undefined;
	let subEmit: Emit<any> | undefined;
	const threadUnsubscribe = jest.fn();
	const subUnsubscribe = jest.fn();

	const threadRecord = {
		observe: () => ({
			subscribe: (cb: Emit<any>) => {
				threadEmit = cb;
				return { unsubscribe: threadUnsubscribe };
			}
		})
	};
	const subRecord = {
		id: 'sub-1',
		observe: () => ({
			subscribe: (cb: Emit<any>) => {
				subEmit = cb;
				return { unsubscribe: subUnsubscribe };
			}
		})
	};

	mockGet.mockImplementation((table: string) => ({
		find: jest.fn(() => Promise.resolve(table === 'messages' ? threadRecord : subRecord))
	}));

	return {
		subRecord,
		threadUnsubscribe,
		subUnsubscribe,
		emitThread: (thread: any) => act(() => threadEmit?.(thread)),
		emitSub: (sub: any) => act(() => subEmit?.(sub))
	};
};

const flush = () => act(() => Promise.resolve());

const renderRightButtons = (overrides: Partial<IUseRightButtonsParams> = {}) => {
	const initialProps: IUseRightButtonsParams = {
		rid: 'rid-1',
		tmid: undefined,
		userId: 'user-1',
		hasE2EEWarning: false,
		toggleRoomE2EEncryptionPermission: ['perm'],
		...overrides
	};
	return renderHook((props: IUseRightButtonsParams) => useRightButtons(props), { initialProps });
};

describe('useRightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockHasPermission.mockResolvedValue([false]);
		mockGetUidDirectMessage.mockReturnValue(undefined);
	});

	it('follows the thread observable and reflects whether the user is a replier', async () => {
		const observables = setupObservables();
		const { result } = renderRightButtons({ tmid: 'tmid-1' });

		await flush();
		observables.emitThread({ replies: ['user-1', 'other'] });
		expect(result.current.isFollowingThread).toBe(true);

		observables.emitThread({ replies: ['other'] });
		expect(result.current.isFollowingThread).toBe(false);
	});

	it('maps the subscription observable to the tunread trio and isSelfDm', async () => {
		mockGetUidDirectMessage.mockReturnValue('user-1');
		const observables = setupObservables();
		const { result } = renderRightButtons();

		await flush();
		expect(result.current.subscription).toBe(observables.subRecord);

		observables.emitSub({
			t: 'd',
			tunread: ['a', 'b'],
			tunreadUser: ['a'],
			tunreadGroup: ['b']
		});

		expect(result.current.tunread).toEqual(['a', 'b']);
		expect(result.current.tunreadUser).toEqual(['a']);
		expect(result.current.tunreadGroup).toEqual(['b']);
		expect(result.current.isSelfDm).toBe(true);
	});

	it('unsubscribes from both observables on unmount', async () => {
		const observables = setupObservables();
		const { unmount } = renderRightButtons({ tmid: 'tmid-1' });

		await flush();
		unmount();

		expect(observables.threadUnsubscribe).toHaveBeenCalledTimes(1);
		expect(observables.subUnsubscribe).toHaveBeenCalledTimes(1);
	});

	it('unsubscribes and re-finds when rid changes', async () => {
		const observables = setupObservables();
		const { rerender } = renderRightButtons();

		await flush();
		rerender({
			rid: 'rid-2',
			tmid: undefined,
			userId: 'user-1',
			hasE2EEWarning: false,
			toggleRoomE2EEncryptionPermission: ['perm']
		});
		await flush();

		expect(observables.subUnsubscribe).toHaveBeenCalledTimes(1);
		expect(mockGet).toHaveBeenCalledWith('subscriptions');
	});

	it('recomputes canToggleEncryption when the subscription version bumps', async () => {
		mockHasPermission.mockResolvedValueOnce([false]).mockResolvedValue([true]);
		const observables = setupObservables();
		const { result } = renderRightButtons({ hasE2EEWarning: true });

		await flush();
		expect(result.current.canToggleEncryption).toBe(false);
		expect(mockHasPermission).toHaveBeenCalledTimes(1);

		observables.emitSub({ tunread: [], tunreadUser: [], tunreadGroup: [] });
		await flush();

		expect(mockHasPermission).toHaveBeenCalledTimes(2);
		expect(result.current.canToggleEncryption).toBe(true);
	});
});
