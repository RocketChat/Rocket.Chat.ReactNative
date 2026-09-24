import { act, renderHook } from '@testing-library/react-native';
import { type ReactElement, useState } from 'react';

import { RoomsSearchContext } from '../../contexts/RoomsSearchProvider';
import { useHeader } from '../useHeader';

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions, navigate: jest.fn(), toggleDrawer: jest.fn(), getParent: jest.fn() };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));

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
		mockIsMasterDetail = false;
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

	it('builds the right cluster in create, push-troubleshoot, directory order', () => {
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems();
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Create new channel, team, direct message or discussion', 'Troubleshooting', 'Directory']);
	});

	it('renders only buttons when push troubleshooting is absent', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightItems = options.unstable_headerRightItems();
		const labels = rightItems.map((item: { accessibilityLabel: string }) => item.accessibilityLabel);
		expect(labels).toEqual(['Create new channel, team, direct message or discussion', 'Directory']);
		expect(rightItems.every((item: { type: string }) => item.type === 'button')).toBe(true);
	});

	it('exposes only the drawer as a native left item', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const leftItems = options.unstable_headerLeftItems();
		expect(leftItems).toHaveLength(1);
		expect(leftItems[0].icon).toEqual({ type: 'image', source: { uri: 'hamburguer' } });
	});

	it('opens the server switcher when the header title is pressed', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		options.onHeaderTitlePress();
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

	it('deactivates the system search bar once search stops on tablet', () => {
		mockIsMasterDetail = true;
		let setSearchEnabled: (value: boolean) => void = () => {};
		const wrapper = ({ children }: { children: ReactElement }) => {
			const [searchEnabled, setter] = useState(true);
			setSearchEnabled = setter;
			return (
				<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled }}>{children}</RoomsSearchContext.Provider>
			);
		};

		renderHook(() => useHeader(), { wrapper });

		const cancelSearch = jest.fn();
		mockSetOptions.mock.calls[0][0].headerSearchBarOptions.ref.current = { cancelSearch };

		act(() => setSearchEnabled(false));

		expect(cancelSearch).toHaveBeenCalledTimes(1);
	});

	it('replaces the tablet right actions with a Cancel item that stops search while searching', () => {
		mockIsTablet = true;
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled: true }}>{children}</RoomsSearchContext.Provider>
		);

		renderHook(() => useHeader(), { wrapper });

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerSearchBarOptions.hideNavigationBar).toBe(false);
		const rightItems = options.unstable_headerRightItems();
		expect(rightItems.map((item: { label: string }) => item.label)).toEqual(['Cancel']);

		rightItems[0].onPress();
		expect(mockStopSearch).toHaveBeenCalledTimes(1);
	});

	it('keeps the iPhone right actions and hides the navigation bar while searching', () => {
		const wrapper = ({ children }: { children: ReactElement }) => (
			<RoomsSearchContext.Provider value={{ ...searchContextValue, searchEnabled: true }}>{children}</RoomsSearchContext.Provider>
		);

		renderHook(() => useHeader(), { wrapper });

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerSearchBarOptions.hideNavigationBar).toBe(true);
		const labels = options.unstable_headerRightItems().map((item: { label: string }) => item.label);
		expect(labels).not.toContain('Cancel');
	});

	it('falls back to the JS header on Android', () => {
		mockIsIOS = false;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerLargeTitle).toBeUndefined();
		expect(typeof options.headerTitle).toBe('function');
	});

	it('uses the native header on iPad', () => {
		mockIsTablet = true;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerLargeTitle).toBe(true);
		expect(options.headerTitle).toBe('Rocket.Chat');
	});
});
