import { renderHook } from '@testing-library/react-native';
import { type NativeStackHeaderItem, type NativeStackHeaderItemMenu } from '@react-navigation/native-stack';

import { type RoomStore } from '~/views/RoomView/definitions';
import { closeLivechat } from '~/views/RoomView/services/closeLivechat';
import { useRoomHeaderRightItems } from '../useRoomHeaderRightItems';

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/hooks/useSetting', () => ({ useSetting: () => false }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => 'user-1' }));
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('~/lib/methods/helpers/navigation/headerIcon', () => ({
	headerIcon: (name: string) => ({ type: 'image', source: name })
}));

let mockRoomState: Record<string, unknown>;
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: Record<string, unknown>) => unknown) => selector(mockRoomState)
}));
jest.mock('zustand/react/shallow', () => ({ useShallow: (selector: unknown) => selector }));

let mockCanPlaceLivechatOnHold = false;
jest.mock('~/ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => false }));
jest.mock('../useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => mockCanPlaceLivechatOnHold }));
jest.mock('../useThreadFollowing', () => ({ useThreadFollowing: () => false }));
const mockGoRoomActions = jest.fn();
jest.mock('../useGoRoomActionsView', () => ({ useGoRoomActionsView: () => mockGoRoomActions }));
jest.mock('~/views/RoomView/services/closeLivechat', () => ({ closeLivechat: jest.fn() }));
jest.mock('~/views/RoomView/services/placeLivechatOnHold', () => ({ placeLivechatOnHold: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ returnLivechat: jest.fn() }));

const mockGoSearchView = jest.fn();
let mockButtonsData: Record<string, unknown>;
jest.mock('../../components/RightButtons/useRoomRightButtonsData', () => ({
	useRoomRightButtonsData: () => mockButtonsData
}));
let mockCallPresent = false;
jest.mock('../../components/RightButtons/useHeaderCallPress', () => ({
	useHeaderCallPress: () => ({ callPresent: mockCallPresent, isCallDisabled: true, onPressCall: jest.fn() })
}));

const roomStore = {} as RoomStore;

const moreMenuOf = (items: NativeStackHeaderItem[]) => {
	const more = items[items.length - 1] as NativeStackHeaderItemMenu;
	expect(more.type).toBe('menu');
	return more.menu.items.map(item => item as Extract<typeof item, { type: 'action' }>);
};

describe('useRoomHeaderRightItems', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCanPlaceLivechatOnHold = false;
		mockCallPresent = false;
		mockRoomState = { room: { t: 'c' }, membership: 'subscribed', canForwardGuest: false };
		mockButtonsData = {
			threadsEnabled: false,
			hasE2EEWarning: false,
			tunread: [],
			threadsAccessibilityLabel: 'Threads',
			callAccessibilityLabel: 'Call',
			goSearchView: mockGoSearchView
		};
	});

	it('lists search and actions in the room more menu and runs the chosen action', () => {
		const { result } = renderHook(() => useRoomHeaderRightItems('rid-1', undefined, roomStore));
		const actions = moreMenuOf(result.current);

		expect(actions.map(action => action.label)).toEqual(['Search messages', 'Actions']);
		actions[1].onPress();
		expect(mockGoRoomActions).toHaveBeenCalled();
	});

	it('moves overflowing header actions into the menu, keeping disabled state', () => {
		mockButtonsData = { ...mockButtonsData, threadsEnabled: true, hasE2EEWarning: true, canToggleEncryption: false };
		mockCallPresent = true;

		const { result } = renderHook(() => useRoomHeaderRightItems('rid-1', undefined, roomStore));
		const actions = moreMenuOf(result.current);

		expect(actions.map(action => [action.label, !!action.disabled])).toEqual([
			['Encrypted', true],
			['Search messages', true],
			['Actions', false]
		]);
	});

	it('shows omnichannel options with close as the destructive last item', () => {
		mockRoomState = { room: { t: 'l' }, membership: 'subscribed', canForwardGuest: true };
		mockCanPlaceLivechatOnHold = true;

		const { result } = renderHook(() => useRoomHeaderRightItems('rid-1', undefined, roomStore));
		const actions = moreMenuOf(result.current);

		expect(actions.map(action => action.label)).toEqual(['Place chat on hold', 'Forward chat', 'Close']);
		expect(actions[2].destructive).toBe(true);
		actions[2].onPress();
		expect(closeLivechat).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1' }));
	});
});
