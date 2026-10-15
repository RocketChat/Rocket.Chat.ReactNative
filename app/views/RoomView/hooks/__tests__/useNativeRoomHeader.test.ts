import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';

import { getUserPresence } from '~/lib/methods/getUsersPresence';
import { type IHeaderFields } from '../useHeaderFields';
import { useNativeRoomHeader } from '../useNativeRoomHeader';

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions };
let mockState: any;

jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: (select: (state: any) => unknown) => select(mockState) }));
jest.mock('~/containers/CustomIcon', () => ({
	iconAssetName: (name: string) => `nano.${name}`,
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

it('sets the title together with the room icon', () => {
	renderHook(() => useNativeRoomHeader({ ...fields, type: 'p', title: 'Shown' }, undefined, undefined, jest.fn()));
	expect(mockSetOptions.mock.calls[0][0]).toMatchObject({
		headerTitle: 'Shown',
		headerSubtitle: 'Topic',
		headerTitleIcon: { type: 'xcasset', name: 'nano.channel-private', tintColor: 'title' }
	});
});

it('shows plain topic text and the room icon', () => {
	renderHook(() => useNativeRoomHeader(fields, undefined, undefined, jest.fn()));
	expect(latestOptions().headerTitleIcon).toEqual({ type: 'xcasset', name: 'nano.channel-public', tintColor: 'title' });
	expect(latestOptions()).toMatchObject({ headerTitle: 'Room', headerSubtitle: 'Topic', headerSubtitleIcon: undefined });
});

it('keeps the parent subtitle and moves its icon below the Thread title while users type', () => {
	mockState.usersTyping = ['Alice'];
	renderHook(() =>
		useNativeRoomHeader({ ...fields, title: '*Thread*', parentTitle: '*Parent*' }, 'thread', undefined, jest.fn())
	);
	expect(latestOptions().headerSubtitleIcon).toEqual({ type: 'xcasset', name: 'nano.channel-public', tintColor: 'title' });
	expect(latestOptions()).toMatchObject({ headerTitle: 'Thread', headerSubtitle: '*Parent*', headerTitleIcon: undefined });
});

it('clears the expiry clock during typing and updates the colored presence image', () => {
	mockState.activeUsers.user = { status: 'online', statusText: 'Working', statusExpiresAt: 'future' };
	const { rerender } = renderHook(() => useNativeRoomHeader({ ...fields, type: 'd' }, undefined, 'user', jest.fn()));
	expect(latestOptions().headerSubtitleIcon).toEqual({ type: 'xcasset', name: 'nano.clock', tintColor: 'subtitle' });
	expect(latestOptions().headerTitleIcon).toEqual({ type: 'xcasset', name: 'nano.status-online', tintColor: 'online' });
	mockState = { ...mockState, usersTyping: ['Alice', 'Bob'], activeUsers: { user: { status: 'busy' } } };
	rerender({});
	expect(latestOptions().headerTitleIcon).toEqual({ type: 'xcasset', name: 'nano.status-busy', tintColor: 'busy' });
	expect(latestOptions().headerSubtitle).toBe('Alice and Bob are_typing...');
	expect(latestOptions().headerSubtitleIcon).toBeUndefined();
});

it('requests missing direct-message presence but respects disabled broadcasting', async () => {
	const { rerender } = renderHook(() => useNativeRoomHeader({ ...fields, type: 'd' }, undefined, 'user', jest.fn()));
	await act(async () => {});
	expect(getUserPresence).toHaveBeenCalledWith('user');
	jest.mocked(getUserPresence).mockClear();
	mockState.settings.Presence_broadcast_disabled = true;
	rerender({});
	await act(async () => {});
	expect(getUserPresence).not.toHaveBeenCalled();
});

it('uses supported Omnichannel app images and falls back to the glyph for SVG icons', async () => {
	const getSize = jest.spyOn(Image, 'getSize').mockImplementation(() => Promise.resolve({ width: 24, height: 24 }));
	mockState.server.server = 'https://chat.example';
	let sourceType = { type: 'app', id: 'app-id', sidebarIcon: 'icon.png' } as IHeaderFields['sourceType'];
	const { rerender } = renderHook(() =>
		useNativeRoomHeader({ ...fields, type: 'l', sourceType }, undefined, undefined, jest.fn())
	);
	await waitFor(() => expect(latestOptions().headerTitleIcon?.source?.uri).toContain('get-sidebar-icon?icon=icon.png'));
	getSize.mockClear();
	sourceType = { ...sourceType, sidebarIcon: 'icon.svg' } as IHeaderFields['sourceType'];
	rerender({});
	await waitFor(() =>
		expect(latestOptions().headerTitleIcon).toEqual({ type: 'xcasset', name: 'nano.omnichannel', tintColor: 'offline' })
	);
	expect(getSize).not.toHaveBeenCalled();
	getSize.mockRestore();
});

it('opens room actions when the title is pressed', () => {
	const onTitlePress = jest.fn();
	renderHook(() => useNativeRoomHeader(fields, undefined, undefined, onTitlePress));
	latestOptions().onHeaderTitlePress({ nativeEvent: {} });
	expect(onTitlePress).toHaveBeenCalledWith();
});

it('does not make the title pressable for invite subscriptions', () => {
	renderHook(() => useNativeRoomHeader({ ...fields, disabled: true }, undefined, undefined, jest.fn()));
	expect(latestOptions().headerTitleIcon).toEqual({ type: 'xcasset', name: 'nano.channel-public', tintColor: 'title' });
	expect(latestOptions().onHeaderTitlePress).toBeUndefined();
});

it('shows the connection state in a thread instead of the parent title and its icon', async () => {
	mockState.meteor = { connected: false, connecting: true };
	renderHook(() => useNativeRoomHeader(fields, 'thread', undefined, jest.fn()));
	await act(async () => {});
	expect(latestOptions()).toMatchObject({ headerSubtitle: 'Connecting', headerSubtitleIcon: undefined });
});

it('shows waiting for network instead of typing users or presence', async () => {
	mockState.meteor = { connected: false, connecting: false };
	mockState.usersTyping = ['Alice'];
	mockState.activeUsers.user = { status: 'online', statusText: 'Working', statusExpiresAt: 'future' };
	renderHook(() => useNativeRoomHeader({ ...fields, type: 'd' }, undefined, 'user', jest.fn()));
	await act(async () => {});
	expect(latestOptions()).toMatchObject({ headerSubtitle: 'Waiting_for_network', headerSubtitleIcon: undefined });
});
