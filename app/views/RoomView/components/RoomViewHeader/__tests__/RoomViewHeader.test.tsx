import { act, render } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type RoomState, type RoomStore } from '~/views/RoomView/definitions';
import { useOmnichannelActions, useRoomActions, useThreadActions } from '~/views/RoomView/hooks/useRoomHeaderActions';
import { useNativeRoomHeader } from '~/views/RoomView/hooks/useNativeRoomHeader';
import { RoomViewHeader } from '../RoomViewHeader';

const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions, goBack: jest.fn(), canGoBack: () => true })
}));

let mockHasNativeHeaderBar = true;
jest.mock('~/lib/methods/helpers', () =>
	Object.defineProperty({ ...jest.requireActual('~/lib/methods/helpers'), getRoomTitle: () => 'general' }, 'hasNativeHeaderBar', {
		get: () => mockHasNativeHeaderBar
	})
);

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: { fontDefault: 'default' } }) }));

jest.mock('~/views/RoomView/hooks/useNativeRoomHeader', () => ({ useNativeRoomHeader: jest.fn() }));
jest.mock('~/views/RoomView/hooks/useGoRoomActionsView', () => ({ useGoRoomActionsView: () => jest.fn() }));
jest.mock('~/views/RoomView/hooks/useUnreadsCount', () => ({ useUnreadsCount: () => 4 }));
jest.mock('~/views/RoomView/components/LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('~/views/RoomView/components/RightButtons/RightButtons', () => ({ __esModule: true, default: 'RightButtons' }));
jest.mock('~/containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
jest.mock('~/lib/methods/helpers/navigation/headerActions', () => ({
	...jest.requireActual('~/lib/methods/helpers/navigation/headerActions'),
	HeaderActions: 'HeaderActions'
}));

jest.mock('~/views/RoomView/components/RightButtons/useRoomRightButtonsData', () => ({ useRoomRightButtonsData: jest.fn() }));
jest.mock('~/views/RoomView/components/RightButtons/useHeaderCallPress', () => ({ useHeaderCallPress: jest.fn() }));

const mockActionsStore = createStore<{ roomActions: IHeaderAction[] }>(() => ({
	roomActions: [{ label: 'Threads', icon: 'threads', onPress: jest.fn() }]
}));
jest.mock('~/views/RoomView/hooks/useRoomHeaderActions', () => {
	const { useStore } = jest.requireActual('zustand');
	return {
		...jest.requireActual('~/views/RoomView/hooks/useRoomHeaderActions'),
		useRoomActions: jest.fn(() => useStore(mockActionsStore, (s: { roomActions: IHeaderAction[] }) => s.roomActions)),
		useThreadActions: jest.fn(() => [{ label: 'Follow_thread', icon: 'notification-disabled', onPress: jest.fn() }]),
		useOmnichannelActions: jest.fn(() => [{ label: 'More', icon: 'kebab', menu: [] }])
	};
});

const makeRoomStore = (room: Partial<RoomState['room']> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general', ...room } as RoomState['room'],
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

const optionsWith = (key: string) => mockSetOptions.mock.calls.map(([options]) => options).filter(options => key in options);
const lastOptionsWith = (key: string) => optionsWith(key).at(-1);

beforeEach(() => {
	jest.clearAllMocks();
	mockHasNativeHeaderBar = true;
	mockIsMasterDetail = false;
	mockActionsStore.setState({ roomActions: [{ label: 'Threads', icon: 'threads', onPress: jest.fn() }] });
});

describe('on the JS header', () => {
	beforeEach(() => {
		mockHasNativeHeaderBar = false;
	});

	it('renders the JS header buttons and title without native items', () => {
		render(<RoomViewHeader rid='rid-1' roomStore={makeRoomStore()} />);

		expect(lastOptionsWith('headerLeft').headerLeft().type).toBe('LeftButtons');
		expect(lastOptionsWith('headerRight').headerRight().type).toBe('RightButtons');
		expect(lastOptionsWith('headerTitle').headerTitle().type).toBe('RoomHeader');
		expect(optionsWith('unstable_headerRightItems')).toHaveLength(0);
		expect(optionsWith('unstable_headerLeftItems')).toHaveLength(0);
	});

	it('renders only the active mode actions in the JS header buttons', () => {
		const { default: ActualRightButtons } = jest.requireActual('~/views/RoomView/components/RightButtons/RightButtons');
		render(<RoomViewHeader rid='rid-1' tmid='tmid-1' roomStore={makeRoomStore()} />);
		expect(useThreadActions).not.toHaveBeenCalled();

		const { props } = lastOptionsWith('headerRight').headerRight();
		const { toJSON } = render(<ActualRightButtons rid={props.rid} tmid={props.tmid} roomStore={props.roomStore} />);

		expect(useThreadActions).toHaveBeenCalledWith('tmid-1');
		expect(useRoomActions).not.toHaveBeenCalled();
		expect(useOmnichannelActions).not.toHaveBeenCalled();
		expect(toJSON()).toMatchObject({
			type: 'HeaderActions',
			props: { actions: [expect.objectContaining({ label: 'Follow_thread' })] }
		});
	});
});

describe('on the native header bar', () => {
	it('drives the title through the native header instead of a JS title', () => {
		render(<RoomViewHeader rid='rid-1' roomStore={makeRoomStore()} />);

		expect(useNativeRoomHeader).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'general' }),
			undefined,
			null,
			expect.any(Function)
		);
		expect(optionsWith('headerTitle')).toHaveLength(0);
	});

	it('leaves the header untouched without a rid', () => {
		render(<RoomViewHeader roomStore={makeRoomStore()} />);

		expect(mockSetOptions).not.toHaveBeenCalled();
	});

	it('shows the room actions on the right and an unread back button on the left', () => {
		render(<RoomViewHeader rid='rid-1' roomStore={makeRoomStore()} />);

		expect(lastOptionsWith('unstable_headerRightItems').unstable_headerRightItems()).toEqual([
			expect.objectContaining({ type: 'button', label: 'Threads' })
		]);
		const backOptions = lastOptionsWith('unstable_headerLeftItems');
		expect(backOptions.headerBackVisible).toBe(false);
		expect(backOptions.unstable_headerLeftItems()).toEqual([expect.objectContaining({ label: '4' })]);
		expect(optionsWith('headerRight')).toHaveLength(0);
	});

	it.each([
		['room', undefined, {}, useRoomActions],
		['thread', 'tmid-1', {}, useThreadActions],
		['omnichannel', undefined, { t: 'l' }, useOmnichannelActions]
	])('mounts only the %s action hook', (_mode, tmid, room, activeHook) => {
		render(<RoomViewHeader rid='rid-1' tmid={tmid} roomStore={makeRoomStore(room)} />);

		[useRoomActions, useThreadActions, useOmnichannelActions].forEach(hook =>
			hook === activeHook ? expect(hook).toHaveBeenCalled() : expect(hook).not.toHaveBeenCalled()
		);
	});

	it('swaps the actions when an omnichannel chat is placed back in the queue', () => {
		const roomStore = makeRoomStore({ t: 'l' });
		render(<RoomViewHeader rid='rid-1' roomStore={roomStore} />);
		expect(lastOptionsWith('unstable_headerRightItems').unstable_headerRightItems()).toHaveLength(1);

		act(() => {
			roomStore.setState({ room: { id: 'sub-1', rid: 'rid-1', t: 'l', status: 'queued' } as RoomState['room'] });
		});

		expect(lastOptionsWith('unstable_headerRightItems').unstable_headerRightItems()).toEqual([]);
	});

	describe('on a master-detail layout', () => {
		beforeEach(() => {
			mockIsMasterDetail = true;
		});

		it('shows the room avatar without the shared glass background instead of the back button', () => {
			render(<RoomViewHeader rid='rid-1' roomStore={makeRoomStore()} />);

			const [avatarItem] = lastOptionsWith('unstable_headerLeftItems').unstable_headerLeftItems();
			expect(avatarItem).toMatchObject({ type: 'custom', hidesSharedBackground: true });
			expect(avatarItem.element.type).toBe('LeftButtons');
			expect(optionsWith('headerBackVisible')).toHaveLength(0);
		});

		it('updates the right items without re-sending the avatar', () => {
			render(<RoomViewHeader rid='rid-1' roomStore={makeRoomStore()} />);
			const leftUpdates = optionsWith('unstable_headerLeftItems').length;

			act(() => {
				mockActionsStore.setState({ roomActions: [{ label: 'Call', icon: 'phone', onPress: jest.fn() }] });
			});

			expect(lastOptionsWith('unstable_headerRightItems').unstable_headerRightItems()).toEqual([
				expect.objectContaining({ label: 'Call' })
			]);
			expect(optionsWith('unstable_headerLeftItems')).toHaveLength(leftUpdates);
		});

		it('keeps the back button on a thread', () => {
			render(<RoomViewHeader rid='rid-1' tmid='tmid-1' roomStore={makeRoomStore()} />);

			expect(lastOptionsWith('unstable_headerLeftItems').unstable_headerLeftItems()).toEqual([
				expect.objectContaining({ label: '4', icon: { type: 'sfSymbol', name: 'chevron.backward' } })
			]);
		});
	});
});
