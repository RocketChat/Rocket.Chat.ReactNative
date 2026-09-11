import { act, renderHook } from '@testing-library/react-native';

import { makeThreadName } from '../../../../lib/methods/helpers/room';
import getRoomInfo from '../../../../lib/methods/getRoomInfo';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import { sendLoadingEvent } from '../../../../containers/Loading';
import getMessageInfo from '../../services/getMessageInfo';
import { useJumpToMessage } from '../useJumpToMessage';
import { type IUseJumpToMessageParams } from '../../definitions';

const mockNavigation = { navigate: jest.fn(), push: jest.fn(), setParams: jest.fn(), addListener: jest.fn() };
let mockRouteParams: { jumpToMessageId?: string; jumpToThreadId?: string } = {};
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation,
	useRoute: () => ({ params: mockRouteParams })
}));
jest.mock('../../../../lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Thread Name') }));
jest.mock('../../../../lib/methods/helpers', () => ({ useDebounce: (fn: (...args: any[]) => any) => fn }));
jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../../lib/methods/getRoomInfo', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve({ rid: 'other-rid' }))
}));
jest.mock('../../services/getMessageInfo', () => ({
	__esModule: true,
	default: jest.fn()
}));
jest.mock('../../services/resolveJumpAnchor', () => ({ resolveJumpAnchor: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../services/fetchThreadName', () => ({ fetchThreadName: jest.fn(() => Promise.resolve('Thread Title')) }));
jest.mock('../../../../lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('../../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));

const mockMakeThreadName = makeThreadName as jest.Mock;
const mockGetRoomInfo = getRoomInfo as jest.Mock;
const mockGoRoom = goRoom as jest.Mock;
const mockGetMessageInfo = getMessageInfo as jest.Mock;

const renderRoomNavigation = (overrides: Partial<IUseJumpToMessageParams> = {}) => {
	const { result } = renderHook(() =>
		useJumpToMessage({
			rid: 'rid-1',
			tmid: undefined,
			t: 'c',
			isMasterDetail: false,
			listContainerRef: { current: null },
			roomUserIdRef: { current: null },
			...overrides
		})
	);

	return { result, navigation: mockNavigation };
};

describe('useJumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRouteParams = {};
	});

	it('Thread press resolves and pushes a thread name for an item carrying its own tmid', async () => {
		const { result, navigation } = renderRoomNavigation();

		await act(async () => {
			result.current.onThreadPress({ id: 'msg-1', tmid: 'thread-1', tmsg: '' } as any);
			await Promise.resolve();
		});

		expect(sendLoadingEvent).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'thread-1',
			name: 'Thread Title',
			t: 'thread',
			roomUserId: null,
			jumpToMessageId: 'msg-1'
		});
	});

	it('Thread press pushes using makeThreadName when opening a thread from its parent message', async () => {
		const { result, navigation } = renderRoomNavigation();

		await act(async () => {
			result.current.onThreadPress({ id: 'msg-1', tlm: '2024-01-01T00:00:00.000Z' } as any);
			await Promise.resolve();
		});

		expect(mockMakeThreadName).toHaveBeenCalled();
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'msg-1',
			name: 'Thread Name',
			t: 'thread',
			roomUserId: null
		});
	});

	it('Message URL fetches the target room info and opens it, forwarding the jump target', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'other-rid' });
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-1', rid: 'other-rid' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-1');
		});

		expect(mockGetRoomInfo).toHaveBeenCalledWith('other-rid');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'other-rid' }, isMasterDetail: false, jumpToMessageId: 'msg-1' });
	});

	it('Message URL navigation is a no-op without a target rid', async () => {
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-1' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-1');
		});

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
	});

	it('jumpToMessageByUrl parses the message id from the url and triggers the jump', async () => {
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-42', rid: 'rid-1' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-42', true);
		});

		expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-42');
	});

	it('jumpToMessageByUrl is a no-op without a url', async () => {
		const { result } = renderRoomNavigation();

		await result.current.jumpToMessageByUrl(undefined);

		expect(mockGetMessageInfo).not.toHaveBeenCalled();
	});
});
