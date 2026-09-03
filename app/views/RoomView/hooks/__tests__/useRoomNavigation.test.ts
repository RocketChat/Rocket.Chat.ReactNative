import { renderHook } from '@testing-library/react-native';

import { makeThreadName } from '../../../../lib/methods/helpers/room';
import { getThreadById } from '../../../../lib/database/services/Thread';
import getThreadName from '../../../../lib/methods/getThreadName';
import getRoomInfo from '../../../../lib/methods/getRoomInfo';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import { sendLoadingEvent } from '../../../../containers/Loading';
import { useJumpToMessage } from '../useJumpToMessage';
import { useRoomNavigation } from '../useRoomNavigation';
import { type IUseRoomNavigationParams } from '../../definitions';

const mockNavigation = { navigate: jest.fn(), push: jest.fn(), setParams: jest.fn(), addListener: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('../useJumpToMessage', () => ({
	useJumpToMessage: jest.fn(() => ({
		jumpToMessage: jest.fn(),
		cancelJumpToMessage: jest.fn(),
		onThreadMessagesLoaded: jest.fn()
	}))
}));
jest.mock('../../../../lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Thread Name') }));
jest.mock('../../../../lib/methods/helpers', () => ({ useDebounce: (fn: (...args: any[]) => any) => fn }));
jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../../lib/database/services/Thread', () => ({ getThreadById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../../../lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread Title'))
}));
jest.mock('../../../../lib/methods/getRoomInfo', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve({ rid: 'other-rid' }))
}));
jest.mock('../../../../lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('../../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));

const mockMakeThreadName = makeThreadName as jest.Mock;
const mockGetThreadById = getThreadById as jest.Mock;
const mockGetThreadName = getThreadName as jest.Mock;
const mockGetRoomInfo = getRoomInfo as jest.Mock;
const mockGoRoom = goRoom as jest.Mock;
const mockUseJumpToMessage = useJumpToMessage as jest.Mock;

const renderRoomNavigation = (overrides: Partial<IUseRoomNavigationParams> = {}) => {
	const { result } = renderHook(() =>
		useRoomNavigation({
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

// navToRoom/navToThread are not part of the hook's public surface: they exist to drive
// useJumpToMessage, so the tests reach them through the props it was called with.
const jumpToMessageProps = () => mockUseJumpToMessage.mock.calls[0][0];

describe('useRoomNavigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('navToThread resolves and pushes a thread name for an item carrying its own tmid', async () => {
		mockGetThreadById.mockResolvedValueOnce(null);
		mockGetThreadName.mockResolvedValueOnce('Resolved Thread');
		const { navigation } = renderRoomNavigation();

		await jumpToMessageProps().navToThread({ id: 'msg-1', tmid: 'thread-1', tmsg: '' } as any);

		expect(sendLoadingEvent).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'thread-1',
			name: 'Resolved Thread',
			t: 'thread',
			roomUserId: null,
			jumpToMessageId: 'msg-1'
		});
	});

	it('navToThread pushes using makeThreadName when opening a thread from its parent message', async () => {
		const { navigation } = renderRoomNavigation();

		await jumpToMessageProps().navToThread({ id: 'msg-1', tlm: '2024-01-01T00:00:00.000Z' } as any);

		expect(mockMakeThreadName).toHaveBeenCalled();
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'msg-1',
			name: 'Thread Name',
			t: 'thread',
			roomUserId: null
		});
	});

	it('navToRoom fetches the target room info and opens it, forwarding the jump target', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'other-rid' });
		renderRoomNavigation();

		await jumpToMessageProps().navToRoom({ id: 'msg-1', rid: 'other-rid' } as any);

		expect(mockGetRoomInfo).toHaveBeenCalledWith('other-rid');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'other-rid' }, isMasterDetail: false, jumpToMessageId: 'msg-1' });
	});

	it('navToRoom is a no-op without a target rid', async () => {
		renderRoomNavigation();

		await jumpToMessageProps().navToRoom({ id: 'msg-1' } as any);

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
	});

	it('jumpToMessageByUrl parses the message id from the url and triggers the jump', async () => {
		const { result } = renderRoomNavigation();
		const { jumpToMessage } = mockUseJumpToMessage.mock.results[0].value;

		await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-42', true);

		expect(jumpToMessage).toHaveBeenCalledWith('msg-42', true);
	});

	it('jumpToMessageByUrl is a no-op without a url', async () => {
		const { result } = renderRoomNavigation();
		const { jumpToMessage } = mockUseJumpToMessage.mock.results[0].value;

		await result.current.jumpToMessageByUrl(undefined);

		expect(jumpToMessage).not.toHaveBeenCalled();
	});
});
