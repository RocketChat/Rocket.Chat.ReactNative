import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { createStore as createZustandStore } from 'zustand';

import { type RoomState, type RoomStore, type TRoomInitResult } from '../../definitions';
import { RoomScreenContext } from '../../stores/RoomScreenContext';
import { RoomStoreContext } from '../../stores/RoomStoreContext';
import { RoomFooter } from './RoomFooter';

// I18n identity: banner assertions match on the translation key itself.
jest.mock('../../../../i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key }
}));

// Mirrors production Touch semantics: it derives enabled from `disabled` (the caller `enabled` is
// overridden), surfaced as an ancestor accessibilityState so RNTL's ancestor traversal can query it.
jest.mock('../../../../containers/Touch', () => {
	const { createElement } = require('react');
	const { View } = require('react-native');
	return {
		__esModule: true,
		default: ({ children, disabled }: { children: ReactNode; disabled?: boolean }) =>
			createElement(View, { accessibilityState: { disabled: disabled === true } }, children)
	};
});

// The composer subtree is heavy and out of scope; a sentinel proves the composer branch.
jest.mock('../../../../containers/MessageComposer', () => {
	const { createElement } = require('react');
	const { View } = require('react-native');
	return {
		__esModule: true,
		MessageComposerContainer: () => createElement(View, { testID: 'message-composer' })
	};
});

type ReduxStateOverrides = {
	settings?: Record<string, unknown>;
	permissions?: Record<string, string[] | undefined>;
	enterpriseModules?: string[];
	userRoles?: string[];
};

const makeReduxStore = ({ settings = {}, permissions = {}, enterpriseModules = [], userRoles = [] }: ReduxStateOverrides = {}) =>
	createStore(() => ({
		login: { user: { username: 'tester', roles: userRoles } },
		settings,
		permissions,
		enterpriseModules
	}));

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createZustandStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		lastMessageFromAgent: false,
		init: jest.fn(() => Promise.resolve<TRoomInitResult>({ status: 'loaded', lastSeen: null })),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve()),
		...overrides
	}));

const renderFooter = (roomStore: RoomStore, reduxStore = makeReduxStore(), loading = false) =>
	render(
		<Provider store={reduxStore}>
			<RoomStoreContext.Provider value={roomStore}>
				<RoomScreenContext.Provider
					value={{ loading, failed: false, retry: jest.fn(), lastSeen: null, clearLastSeen: jest.fn() }}>
					<RoomFooter messageComposerRef={{ current: null }} joinCodeRef={{ current: null }} />
				</RoomScreenContext.Provider>
			</RoomStoreContext.Provider>
		</Provider>
	);

describe('RoomFooter', () => {
	it('renders the on-hold state when the room is on hold', () => {
		renderFooter(makeRoomStore({ room: { rid: 'rid-1', t: 'c', onHold: true } }));

		expect(screen.getByTestId('room-view-chat-on-hold')).toBeOnTheScreen();
		expect(screen.getByTestId('room-view-chat-on-hold-button')).toHaveTextContent('Resume');
		expect(screen.getByTestId('room-view-chat-on-hold-button')).toBeEnabled();
	});

	it('disables the resume button while a request is in flight', () => {
		renderFooter(makeRoomStore({ room: { rid: 'rid-1', t: 'c', onHold: true } }), makeReduxStore(), true);

		expect(screen.getByTestId('room-view-chat-on-hold-button')).toBeDisabled();
	});

	it('renders the Join state when the user has not joined a channel', () => {
		renderFooter(makeRoomStore({ joined: false, room: { rid: 'rid-1', t: 'c' } }));

		expect(screen.getByTestId('room-view-join')).toBeOnTheScreen();
		expect(screen.getByTestId('room-view-join-button')).toHaveTextContent('Join');
		expect(screen.getByTestId('room-view-join-button')).toBeEnabled();
	});

	it('renders the Take it state for an unjoined livechat room', () => {
		renderFooter(makeRoomStore({ joined: false, room: { rid: 'rid-1', t: 'l' } }));

		expect(screen.getByTestId('room-view-join-button')).toHaveTextContent('Take_it');
	});

	it('disables the join button while a request is in flight', () => {
		renderFooter(makeRoomStore({ joined: false, room: { rid: 'rid-1', t: 'c' } }), makeReduxStore(), true);

		expect(screen.getByTestId('room-view-join-button')).toBeDisabled();
	});

	it('renders the air-gapped banner when restrictions have zero remaining days', () => {
		renderFooter(makeRoomStore(), makeReduxStore({ settings: { Cloud_Workspace_AirGapped_Restrictions_Remaining_Days: 0 } }));

		expect(screen.getByText('AirGapped_workspace_read_only_title')).toBeOnTheScreen();
	});

	it('does not render the air-gapped banner when days remain', () => {
		renderFooter(makeRoomStore(), makeReduxStore({ settings: { Cloud_Workspace_AirGapped_Restrictions_Remaining_Days: 5 } }));

		expect(screen.queryByText('AirGapped_workspace_read_only_title')).toBeNull();
		expect(screen.getByTestId('message-composer')).toBeOnTheScreen();
	});

	it('renders the read-only banner when the room is read only', () => {
		renderFooter(makeRoomStore({ room: { id: 'sub-1', rid: 'rid-1', t: 'c', ro: true, roles: [] } as any }));

		expect(screen.getByText('This_room_is_read_only')).toBeOnTheScreen();
	});

	it('renders the blocked banner for a blocked direct message', () => {
		renderFooter(makeRoomStore({ room: { id: 'sub-1', rid: 'rid-1', t: 'd', blocked: true } as any }));

		expect(screen.getByText('This_room_is_blocked')).toBeOnTheScreen();
	});

	it('renders the invalid-version banner for a federated room without a federation object', () => {
		renderFooter(makeRoomStore({ room: { id: 'sub-1', rid: 'rid-1', t: 'c', federated: true } as any }));

		expect(screen.getByText('Federation_Matrix_room_description_invalid_version')).toBeOnTheScreen();
	});

	it('renders the disabled banner for a native-federated room when federation is off', () => {
		const room = { id: 'sub-1', rid: 'rid-1', t: 'c', federated: true, federation: { version: 1, mrid: 'm', origin: 'o' } };
		renderFooter(makeRoomStore({ room: room as any }), makeReduxStore({ settings: { Federation_Matrix_enabled: false } }));

		expect(screen.getByText('Federation_Matrix_room_description_disabled')).toBeOnTheScreen();
	});

	it('renders the missing-module banner when federation is enabled but the module is not', () => {
		const room = { id: 'sub-1', rid: 'rid-1', t: 'c', federated: true, federation: { version: 1, mrid: 'm', origin: 'o' } };
		renderFooter(
			makeRoomStore({ room: room as any }),
			makeReduxStore({ settings: { Federation_Matrix_enabled: true }, enterpriseModules: [] })
		);

		expect(screen.getByText('Federation_Matrix_room_description_missing_module')).toBeOnTheScreen();
	});

	it('renders the composer for a joined, writable room', () => {
		renderFooter(makeRoomStore());

		expect(screen.getByTestId('message-composer')).toBeOnTheScreen();
	});
});
