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

jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/hooks/useIsAccessibilityNavigationEnabled', () => ({ useIsAccessibilityNavigationEnabled: () => false }));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [true, false, false, false, false] }));
jest.mock('~/selectors/login', () => ({ getUserSelector: () => ({ requirePasswordChange: false }) }));
const mockColors = { fontDanger: '#f00', buttonBackgroundDangerDefault: '#f00', userPresenceDisabled: '#f00' };
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: mockColors }) }));
jest.mock('~/containers/ActionSheet', () => ({ showActionSheetRef: jest.fn() }));
jest.mock('../../components/Header', () => ({ __esModule: true, default: 'RoomsListHeaderView' }));

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
	server: { loading: false },
	login: { isFetching: false },
	rooms: { isFetching: false }
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
			server: { loading: false },
			login: { isFetching: false },
			rooms: { isFetching: false }
		};
	});

	it('sets a native string title with a large title on iPhone', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerTitle).toBe('string');
		expect(options.headerTitle).toBe('Chats');
		expect(options.headerLargeTitle).toBe(true);
	});

	it.each([
		[{ meteor: { connecting: true, connected: true } }, 'Connecting...'],
		[{ login: { isFetching: true } }, 'Connecting...'],
		[{ rooms: { isFetching: true } }, 'Updating...'],
		[{ meteor: { connecting: false, connected: false } }, 'Waiting for network...'],
		[{ meteor: { connecting: false, connected: false }, rooms: { isFetching: true } }, 'Waiting for network...']
	])('swaps the native title to the connection state %j', (stateOverride, expectedTitle) => {
		mockAppState = { ...mockAppState, ...stateOverride } as typeof mockAppState;

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		expect(options.headerTitle).toBe(expectedTitle);
	});

	it('builds the right cluster in create, push-troubleshoot priority order, overflowing directory', () => {
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightButtons: ReactElement<{ testID: string }>[] = options.headerRight().props.children.filter(Boolean);
		const testIDs = rightButtons.map(button => button.props.testID);
		expect(testIDs).toEqual(['rooms-list-view-create-channel', 'rooms-list-view-push-troubleshoot', 'rooms-list-view-directory']);
	});

	it('does not render an overflow control when nothing extra is present', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightButtons: ReactElement<{ testID: string }>[] = options.headerRight().props.children.filter(Boolean);
		const testIDs = rightButtons.map(button => button.props.testID);
		expect(testIDs).toEqual(['rooms-list-view-create-channel', 'rooms-list-view-directory']);
	});

	it('configures a stacked system search bar instead of a right-cluster search item', () => {
		renderUseHeader();

		const options = mockSetOptions.mock.calls[0][0];
		const rightButtons: ReactElement<{ testID: string }>[] = options.headerRight().props.children.filter(Boolean);
		expect(rightButtons.some(button => button.props.testID === 'rooms-list-view-search')).toBe(false);

		expect(options.headerSearchBarOptions.placement).toBe('stacked');
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
