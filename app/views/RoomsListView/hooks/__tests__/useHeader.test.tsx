import { act, renderHook } from '@testing-library/react-native';
import { type ReactElement, useState } from 'react';

import { RoomsSearchContext } from '../../contexts/RoomsSearchProvider';
import { useHeader } from '../useHeader';

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions, navigate: jest.fn(), toggleDrawer: jest.fn() };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation,
	useFocusEffect: jest.fn()
}));

let mockIsIOS = true;
let mockIsTablet = false;
jest.mock('~/lib/methods/helpers', () =>
	Object.defineProperties(
		{ ...jest.requireActual('~/lib/methods/helpers') },
		{
			isIOS: { get: () => mockIsIOS, configurable: true },
			isTablet: { get: () => mockIsTablet, configurable: true },
			hasNativeHeaderBar: { get: () => mockIsIOS && !mockIsTablet, configurable: true }
		}
	)
);

jest.mock('~/lib/methods/helpers/navigation/headerIcon', () => ({
	headerIcon: (name: string) => ({ type: 'image', source: { uri: name } })
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/hooks/useIsAccessibilityNavigationEnabled', () => ({ useIsAccessibilityNavigationEnabled: () => false }));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [true, false, false, false, false] }));
jest.mock('~/selectors/login', () => ({ getUserSelector: () => ({ requirePasswordChange: false }) }));
const mockColors = { fontDanger: '#f00', buttonBackgroundDangerDefault: '#f00', userPresenceDisabled: '#f00' };
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: mockColors }) }));
const mockShowActionSheetRef = jest.fn();
jest.mock('~/containers/ActionSheet', () => ({ showActionSheetRef: (...args: unknown[]) => mockShowActionSheetRef(...args) }));
jest.mock('../../components/Header', () => ({ __esModule: true, default: 'RoomsListHeaderView' }));
jest.mock('../../components/ServersList', () => ({ __esModule: true, default: 'ServersList' }));

jest.mock('~/containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: unknown }) => ReactActual.createElement('Container', null, children),
		Item: (props: Record<string, unknown>) => ReactActual.createElement('Item', props),
		Drawer: (props: Record<string, unknown>) => ReactActual.createElement('Drawer', props),
		More: (props: Record<string, unknown>) => ReactActual.createElement('More', props),
		BadgeWarn: () => null
	};
});

let mockAppState = {
	supportedVersions: { status: 'supported' },
	troubleshootingNotification: { issuesWithNotifications: false },
	app: { notificationPresenceCap: false },
	meteor: { connecting: false, connected: true },
	server: { loading: false, server: 'https://open.rocket.chat' },
	login: { isFetching: false },
	rooms: { isFetching: false },
	settings: { Site_Name: 'Rocket.Chat' }
};
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

const mockStartSearch = jest.fn();
const mockStopSearch = jest.fn();
const mockSearch = jest.fn();
const searchContextValue = {
	searching: false,
	searchEnabled: false,
	searchResults: [],
	startSearch: mockStartSearch,
	stopSearch: mockStopSearch,
	search: mockSearch
};

const renderUseHeader = () =>
	renderHook(() => useHeader(), {
		wrapper: ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={searchContextValue}>{children}</RoomsSearchContext.Provider>
		)
	});

describe('RoomsListView useHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsIOS = true;
		mockIsTablet = false;
		mockAppState = {
			supportedVersions: { status: 'supported' },
			troubleshootingNotification: { issuesWithNotifications: false },
			app: { notificationPresenceCap: false },
			meteor: { connecting: false, connected: true },
			server: { loading: false, server: 'https://open.rocket.chat' },
			login: { isFetching: false },
			rooms: { isFetching: false },
			settings: { Site_Name: 'Rocket.Chat' }
		};
	});

	it('sets the server name as a native string title with the server url as subtitle on iPhone', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerTitle).toBe('string');
		expect(options.headerTitle).toBe('Rocket.Chat');
		expect(options.headerSubtitle).toBe('open.rocket.chat');
		expect(options.headerLargeTitle).toBe(true);
	});

	it.each([
		[{ supportedVersions: { status: 'expired' } }, 'Cannot connect'],
		[{ meteor: { connecting: true, connected: true } }, 'Connecting...'],
		[{ login: { isFetching: true } }, 'Connecting...'],
		[{ rooms: { isFetching: true } }, 'Updating...'],
		[{ meteor: { connecting: false, connected: false } }, 'Waiting for network...'],
		[{ meteor: { connecting: false, connected: false }, rooms: { isFetching: true } }, 'Updating...']
	])('swaps the native subtitle to the connection state %j', (stateOverride, expectedSubtitle) => {
		mockAppState = { ...mockAppState, ...stateOverride } as typeof mockAppState;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerTitle).toBe('Rocket.Chat');
		expect(options.headerSubtitle).toBe(expectedSubtitle);
	});

	it('builds the right cluster in create, push-troubleshoot priority order, overflowing directory', () => {
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems();
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Create new channel, team, direct message or discussion', 'Troubleshooting', 'Directory']);
	});

	it('does not render an overflow control when nothing extra is present', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems();
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Create new channel, team, direct message or discussion', 'Directory']);
		expect(rightItems.every((item: { type: string }) => item.type === 'button')).toBe(true);
	});

	it('exposes the drawer and server switcher as native left items', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const leftItems = options.unstable_headerLeftItems();
		expect(leftItems).toHaveLength(2);
		expect(leftItems[0].icon).toEqual({ type: 'image', source: { uri: 'hamburguer' } });
		expect(leftItems[1].icon).toEqual({ type: 'image', source: { uri: 'workspaces' } });
		expect(leftItems[1].label).toBe('Rocket.Chat');

		leftItems[1].onPress();
		expect(mockShowActionSheetRef).toHaveBeenCalledWith(expect.objectContaining({ enableContentPanningGesture: false }));
	});

	it('configures a system search bar instead of a right-cluster search item', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems();
		expect(rightItems.some((item: { accessibilityLabel: string }) => item.accessibilityLabel === 'Search')).toBe(false);

		expect(options.headerSearchBarOptions.placement).toBe('automatic');
		expect(options.headerSearchBarOptions.ref.current).toBeNull();

		options.headerSearchBarOptions.onFocus();
		expect(mockStartSearch).toHaveBeenCalledTimes(1);

		options.headerSearchBarOptions.onChangeText({ nativeEvent: { text: 'general' } });
		expect(mockSearch).toHaveBeenCalledWith('general');

		options.headerSearchBarOptions.onCancelButtonPress();
		expect(mockStopSearch).toHaveBeenCalledTimes(1);
	});

	it('clears the system search bar once search stops', () => {
		let setSearchEnabled: (value: boolean) => void = () => {};
		const wrapper = ({ children }: { children: ReactElement }) => {
			const [searchEnabled, setter] = useState(true);
			setSearchEnabled = setter;
			return (
				<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled }}>{children}</RoomsSearchContext.Provider>
			);
		};

		renderHook(() => useHeader(), { wrapper });

		const clearText = jest.fn();
		mockSetOptions.mock.calls[0][0].headerSearchBarOptions.ref.current = { clearText };

		act(() => setSearchEnabled(false));

		expect(clearText).toHaveBeenCalledTimes(1);
	});

	it('falls back to the JS header on Android', () => {
		mockIsIOS = false;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerLargeTitle).toBeUndefined();
		expect(typeof options.headerTitle).toBe('function');
	});

	it('falls back to the JS header on iPad', () => {
		mockIsTablet = true;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerLargeTitle).toBeUndefined();
		expect(typeof options.headerTitle).toBe('function');
	});
});
