import { renderHook } from '@testing-library/react-native';
import { createRef, type ReactElement } from 'react';
import { type SearchBarCommands } from 'react-native-screens';

import { RoomsSearchContext } from '../../contexts/RoomsSearchProvider';
import { useJsRoomsListHeader } from '../useJsRoomsListHeader';
import { useNativeRoomsListHeader } from '../useNativeRoomsListHeader';

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions, navigate: jest.fn(), getParent: jest.fn() };

let mockRouteName = 'RoomsListView';
jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		useNavigation: () => mockNavigation,
		useRoute: () => ({ name: mockRouteName }),
		useFocusEffect: (effect: () => void) => useEffect(effect, [effect])
	};
});

let mockIsIOS = true;
let mockIsTablet = false;
jest.mock('~/lib/methods/helpers', () =>
	Object.defineProperties(
		{ ...jest.requireActual('~/lib/methods/helpers') },
		{
			hasNativeHeaderBar: { get: () => mockIsIOS, configurable: true },
			isTablet: { get: () => mockIsTablet, configurable: true }
		}
	)
);

jest.mock('~/lib/methods/helpers/deviceInfo', () =>
	Object.defineProperties(
		{ ...jest.requireActual('~/lib/methods/helpers/deviceInfo') },
		{
			hasNativeHeaderBar: { get: () => mockIsIOS, configurable: true },
			isTablet: { get: () => mockIsTablet, configurable: true }
		}
	)
);

jest.mock('~/lib/methods/helpers/navigation/headerIcon', () => ({
	headerIcon: (name: string) => ({ type: 'image', source: { uri: name } })
}));

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));
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
const mockResetSearch = jest.fn();
const mockSearch = jest.fn();
const searchContextValue = {
	searching: false,
	searchEnabled: false,
	searchResults: [],
	startSearch: mockStartSearch,
	stopSearch: mockStopSearch,
	resetSearch: mockResetSearch,
	search: mockSearch,
	searchBarRef: createRef<SearchBarCommands>()
};

const renderUseHeader = (useHeader = useNativeRoomsListHeader) =>
	renderHook(() => useHeader(), {
		wrapper: ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={searchContextValue}>{children}</RoomsSearchContext.Provider>
		)
	});

const originalDev = __DEV__;

describe('RoomsListView useHeader', () => {
	afterEach(() => {
		// @ts-expect-error __DEV__ is not writable but we need to test
		global.__DEV__ = originalDev;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockIsIOS = true;
		mockIsTablet = false;
		mockIsMasterDetail = false;
		mockRouteName = 'RoomsListView';
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
	});

	it('keeps a string native title while the server name is not loaded yet', () => {
		mockAppState = { ...mockAppState, settings: {} } as typeof mockAppState;

		renderUseHeader();

		expect(mockSetOptions.mock.calls[0][0].headerTitle).toBe('');
	});

	it.each([
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

	it('keeps the server url as the native subtitle when the server version is expired', () => {
		mockAppState = { ...mockAppState, supportedVersions: { status: 'expired' } };

		renderUseHeader();

		expect(mockSetOptions.mock.calls[0][0].headerSubtitle).toBe('open.rocket.chat');
	});

	it('builds the right cluster in push-troubleshoot, directory, display order, then the toolbar create item', () => {
		// @ts-expect-error __DEV__ is not writable but we need to test
		global.__DEV__ = false;
		mockIsMasterDetail = true;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems({});
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Troubleshooting', 'Directory', 'Display', 'Create new channel, team, direct message or discussion']);
	});

	it('hides push troubleshooting in development builds', () => {
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems({});
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).not.toContain('Troubleshooting');
	});

	it('keeps the toolbar free on phones, where the tab bar owns the bottom edge', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const toolbarItems = options
			.unstable_headerRightItems({})
			.filter((item: { placement?: string }) => item.placement === 'toolbar');
		expect(toolbarItems).toEqual([]);
	});

	it('places only the create item in the toolbar on master detail, as a prominent button', () => {
		mockIsMasterDetail = true;
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const toolbarItems = options
			.unstable_headerRightItems({})
			.filter((item: { placement?: string }) => item.placement === 'toolbar');
		expect(toolbarItems).toEqual([
			expect.objectContaining({
				accessibilityLabel: 'Create new channel, team, direct message or discussion',
				type: 'button',
				variant: 'prominent'
			})
		]);
	});

	it('renders only buttons when push troubleshooting is absent', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems({});
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Directory', 'Display']);
		expect(rightItems.every((item: { type: string }) => item.type === 'button')).toBe(true);
	});

	it('has no native left item on phones, where the menu lives in a tab', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.unstable_headerLeftItems({})).toEqual([]);
	});

	it('opens Settings from the native left item on master detail', () => {
		mockIsMasterDetail = true;
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const leftItems = options.unstable_headerLeftItems({});
		expect(leftItems).toHaveLength(1);
		expect(leftItems[0].icon).toEqual({ type: 'image', source: { uri: 'hamburguer' } });

		leftItems[0].onPress();
		expect(mockNavigation.navigate).toHaveBeenCalledWith('ModalStackNavigator', { screen: 'SettingsView' });
	});

	it('opens the server switcher when the header title is pressed', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		options.onHeaderTitlePress();
		expect(mockShowActionSheetRef).toHaveBeenCalledWith(expect.objectContaining({ enableContentPanningGesture: false }));
	});

	it('leaves the search bar to the Search tab on phones', () => {
		renderUseHeader();

		expect(mockSetOptions.mock.calls[0][0].headerSearchBarOptions).toBeUndefined();
	});

	it('configures a stacked system search bar on master detail instead of a right-cluster search item', () => {
		mockIsMasterDetail = true;
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems({});
		expect(rightItems.some((item: { accessibilityLabel: string }) => item.accessibilityLabel === 'Search')).toBe(false);

		expect(options.headerSearchBarOptions.placement).toBe('stacked');
		expect(options.headerSearchBarOptions.ref.current).toBeNull();

		options.headerSearchBarOptions.onFocus();
		expect(mockStartSearch).toHaveBeenCalledTimes(1);

		options.headerSearchBarOptions.onChangeText({ nativeEvent: { text: 'general' } });
		expect(mockSearch).toHaveBeenCalledWith('general');

		expect(options.headerSearchBarOptions.ref).toBe(searchContextValue.searchBarRef);

		options.headerSearchBarOptions.onCancelButtonPress();
		expect(mockResetSearch).toHaveBeenCalledTimes(1);
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it('puts the Search tab search bar in the bottom toolbar next to the create item', () => {
		mockRouteName = 'RoomsSearchView';
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerSearchBarOptions.placement).toBe('automatic');
		const toolbarLabels = options
			.unstable_headerRightItems({})
			.filter((item: { placement?: string }) => item.placement === 'toolbar')
			.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(toolbarLabels).toEqual(['Create new channel, team, direct message or discussion']);
	});

	it('focuses the search bar when the Search tab is focused', () => {
		mockRouteName = 'RoomsSearchView';
		const focus = jest.fn();
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider
				value={{ ...searchContextValue, searchBarRef: { current: { focus } as unknown as SearchBarCommands } }}>
				{children}
			</RoomsSearchContext.Provider>
		);

		renderHook(() => useNativeRoomsListHeader(), { wrapper });

		expect(focus).toHaveBeenCalledTimes(1);
	});

	it('returns to the Chats tab when the Search tab search is cancelled', () => {
		mockRouteName = 'RoomsSearchView';
		renderUseHeader();

		mockSetOptions.mock.calls[0][0].headerSearchBarOptions.onCancelButtonPress();

		expect(mockResetSearch).toHaveBeenCalledTimes(1);
		expect(mockNavigation.navigate).toHaveBeenCalledWith('RoomsListStackNavigator');
	});

	it('replaces the tablet right actions with a Cancel item that stops search while searching', () => {
		mockIsTablet = true;
		mockIsMasterDetail = true;
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled: true }}>{children}</RoomsSearchContext.Provider>
		);

		renderHook(() => useNativeRoomsListHeader(), { wrapper });

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerSearchBarOptions.hideNavigationBar).toBe(false);
		const rightItems = options.unstable_headerRightItems({});
		expect(rightItems.map((item: { label: string }) => item.label)).toEqual(['Cancel']);

		rightItems[0].onPress();
		expect(mockStopSearch).toHaveBeenCalledTimes(1);
	});

	it('keeps the iPhone right actions and hides the navigation bar while searching', () => {
		mockRouteName = 'RoomsSearchView';
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled: true }}>{children}</RoomsSearchContext.Provider>
		);

		renderHook(() => useNativeRoomsListHeader(), { wrapper });

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerSearchBarOptions.hideNavigationBar).toBe(true);
		const labels = options.unstable_headerRightItems({}).map((item: { label: string }) => item.label);
		expect(labels).not.toContain('Cancel');
	});

	it('does not restart the search when the system search bar is refocused while searching', () => {
		mockRouteName = 'RoomsSearchView';
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled: true }}>{children}</RoomsSearchContext.Provider>
		);

		renderHook(() => useNativeRoomsListHeader(), { wrapper });

		mockSetOptions.mock.calls[0][0].headerSearchBarOptions.onFocus?.();
		expect(mockStartSearch).not.toHaveBeenCalled();
	});

	it('renders the JS header without a native bar', () => {
		renderUseHeader(useJsRoomsListHeader);

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerLargeTitle).toBeUndefined();
		expect(typeof options.headerTitle).toBe('function');
	});

	it('uses the native header on iPad', () => {
		mockIsTablet = true;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerTitle).toBe('Rocket.Chat');
	});
});
