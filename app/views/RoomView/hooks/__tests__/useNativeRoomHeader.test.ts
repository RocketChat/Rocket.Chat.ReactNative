import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';

import { IconSet } from '~/containers/CustomIcon';
import { getUserPresence } from '~/lib/methods/getUsersPresence';
import { type IHeaderFields } from '../useHeader';
import { useNativeRoomHeader } from '../useNativeRoomHeader';

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions };
let mockState: any;

jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: (select: (state: any) => unknown) => select(mockState) }));
jest.mock('~/containers/CustomIcon', () => ({
	IconSet: { getImageSource: jest.fn(async (name, size, color) => ({ uri: `${name}:${color}`, width: size, height: size })) },
	hasIcon: () => true
}));
jest.mock('~/lib/hooks/usePreviewFormatText', () => ({ __esModule: true, default: (text: string) => text.replaceAll('*', '') }));
jest.mock('~/lib/hooks/useUserStatusColor', () => ({ useUserStatusColor: (status: string) => status }));
jest.mock('~/lib/methods/getUsersPresence', () => ({ getUserPresence: jest.fn() }));
jest.mock('~/lib/methods/helpers/formatStatusExpiry', () => ({ formatStatusExpiry: (expiry?: string) => expiry }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/theme', () => ({ useTheme: () => ({ colors: { fontTitlesLabels: 'title', fontSecondaryInfo: 'subtitle' } }) }));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const fields: IHeaderFields = {
	title: 'Room',
	parentTitle: 'Parent',
	teamMain: false,
	subtitle: '*Topic*',
	type: 'c',
	isGroupChat: false,
	abacAttributes: undefined,
	disabled: false
};
const latestOptions = () => mockSetOptions.mock.calls.at(-1)?.[0];

beforeEach(() => {
	jest.clearAllMocks();
	mockState = {
		meteor: { connected: true, connecting: false },
		server: { loading: false },
		settings: {},
		activeUsers: {},
		usersTyping: []
	};
});

it('sets the title before the room icon is ready and adds the icon when it loads', async () => {
	renderHook(() => useNativeRoomHeader(true, { ...fields, type: 'p', title: 'Shown' }));
	expect(mockSetOptions.mock.calls[0][0]).toMatchObject({ headerTitle: 'Shown', headerSubtitle: 'Topic' });
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toBe('channel-private:title'));
	expect(latestOptions().headerTitle).toBe('Shown');
});

it('shows plain topic text and the room icon', async () => {
	renderHook(() => useNativeRoomHeader(true, fields));
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toBe('channel-public:title'));
	expect(latestOptions()).toMatchObject({ headerTitle: 'Room', headerSubtitle: 'Topic', headerSubtitleImageSource: undefined });
});

it('keeps the parent subtitle and moves its icon below the Thread title while users type', async () => {
	mockState.usersTyping = ['Alice'];
	renderHook(() => useNativeRoomHeader(true, { ...fields, title: '*Thread*', parentTitle: '*Parent*' }, 'thread'));
	await waitFor(() => expect(latestOptions().headerSubtitleImageSource?.uri).toBe('channel-public:title'));
	expect(latestOptions()).toMatchObject({ headerTitle: 'Thread', headerSubtitle: '*Parent*', headerTitleImageSource: undefined });
});

it('clears the expiry clock during typing and updates the colored presence image', async () => {
	mockState.activeUsers.user = { status: 'online', statusText: 'Working', statusExpiresAt: 'future' };
	const { rerender } = renderHook(() => useNativeRoomHeader(true, { ...fields, type: 'd' }, undefined, 'user'));
	await waitFor(() => expect(latestOptions().headerSubtitleImageSource?.uri).toBe('clock:subtitle'));
	expect(latestOptions().headerTitleImageSource.uri).toBe('status-online:online');
	mockState = { ...mockState, usersTyping: ['Alice', 'Bob'], activeUsers: { user: { status: 'busy' } } };
	rerender({});
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toBe('status-busy:busy'));
	expect(latestOptions().headerSubtitle).toBe('Alice and Bob are_typing...');
	expect(latestOptions().headerSubtitleImageSource).toBeUndefined();
});

it('requests missing direct-message presence but respects disabled broadcasting', async () => {
	const { rerender } = renderHook(() => useNativeRoomHeader(true, { ...fields, type: 'd' }, undefined, 'user'));
	await act(async () => {});
	expect(getUserPresence).toHaveBeenCalledWith('user');
	jest.mocked(getUserPresence).mockClear();
	mockState.settings.Presence_broadcast_disabled = true;
	rerender({});
	await act(async () => {});
	expect(getUserPresence).not.toHaveBeenCalled();
});

it('does not configure or render native images when disabled', async () => {
	renderHook(() => useNativeRoomHeader(false, fields));
	await act(async () => {});
	expect(mockSetOptions).not.toHaveBeenCalled();
	expect(IconSet.getImageSource).not.toHaveBeenCalled();
});

it('uses supported Omnichannel app images and falls back when decoding fails', async () => {
	const getSize = jest.spyOn(Image, 'getSize').mockImplementation(() => Promise.resolve({ width: 24, height: 24 }));
	mockState.server.server = 'https://chat.example';
	let sourceType = { type: 'app', id: 'app-id', sidebarIcon: 'icon.png' } as IHeaderFields['sourceType'];
	const { rerender } = renderHook(() => useNativeRoomHeader(true, { ...fields, type: 'l', sourceType }));
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toContain('get-sidebar-icon?icon=icon.png'));
	getSize.mockImplementation(() => Promise.reject(new Error('Unsupported image')));
	sourceType = { ...sourceType, sidebarIcon: 'icon.svg' } as IHeaderFields['sourceType'];
	rerender({});
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toBe('omnichannel:offline'));
	getSize.mockRestore();
});

it('opens room actions when the title is pressed', async () => {
	const onTitlePress = jest.fn();
	renderHook(() => useNativeRoomHeader(true, fields, undefined, undefined, onTitlePress));
	await waitFor(() => expect(latestOptions().onHeaderTitlePress).toBeInstanceOf(Function));
	latestOptions().onHeaderTitlePress({ nativeEvent: {} });
	expect(onTitlePress).toHaveBeenCalledWith();
});

it('does not make the title pressable for invite subscriptions', async () => {
	renderHook(() => useNativeRoomHeader(true, { ...fields, disabled: true }, undefined, undefined, jest.fn()));
	await waitFor(() => expect(latestOptions().headerTitleImageSource?.uri).toBe('channel-public:title'));
	expect(latestOptions().onHeaderTitlePress).toBeUndefined();
});
