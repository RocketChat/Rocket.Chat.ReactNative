import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore as createReduxStore } from 'redux';

import RoomGate from './index';
import { type IRoomViewProps } from './definitions';
import { type RoomState } from '../../lib/store/roomStore.types';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { useE2EEStatus } from './hooks/useE2EEStatus';

jest.mock('./RoomScreen', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { __esModule: true, default: () => createElement(RNView, { testID: 'room-screen' }) };
});
jest.mock('./components/InvitedRoomScreen', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { InvitedRoomScreen: () => createElement(RNView, { testID: 'invited-screen' }) };
});
jest.mock('./components/MissingRoomE2EEKey', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { MissingRoomE2EEKey: () => createElement(RNView, { testID: 'missing-key-screen' }) };
});
jest.mock('./components/EncryptedRoom', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { EncryptedRoom: () => createElement(RNView, { testID: 'encrypted-screen' }) };
});
jest.mock('./hooks/useHeader', () => ({ useHeader: jest.fn() }));
jest.mock('./hooks/useE2EEStatus', () => ({
	useE2EEStatus: jest.fn(() => ({ showMissingE2EEKey: false, showE2EEDisabledRoom: false }))
}));
jest.mock('../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../lib/methods/helpers', () => ({ getUidDirectMessage: jest.fn(), getRoomTitle: jest.fn(() => 'Room Title') }));

const room: { current: RoomState['room'] } = { current: { rid: 'rid-1', t: 'c' } };

jest.mock('./stores/RoomStore', () => {
	const { createStore } = require('zustand');
	const store = createStore(() => ({ room: {}, roomUpdate: {} }));
	return {
		useRoomStoreForScreen: () => {
			store.setState({ room: room.current, roomUpdate: {} }, true);
			return store;
		}
	};
});

const renderGate = () => {
	const reduxStore = createReduxStore(() => ({ server: { version: '6.1.0' } }));
	const props = {
		route: { params: { rid: 'rid-1', t: 'c' } },
		navigation: { setOptions: jest.fn() }
	} as unknown as IRoomViewProps;
	return render(
		<Provider store={reduxStore}>
			<View>
				<RoomGate {...props} />
			</View>
		</Provider>
	);
};

describe('RoomGate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		room.current = { rid: 'rid-1', t: 'c' };
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: false, showE2EEDisabledRoom: false });
		jest.mocked(isInviteSubscription).mockReturnValue(false);
	});

	it('mounts the room screen when the room is not blocked', () => {
		renderGate();

		expect(screen.getByTestId('room-screen')).toBeOnTheScreen();
	});

	it('keeps the room screen unmounted while the room is an invite', () => {
		room.current = { id: 'sub-1', rid: 'rid-1', t: 'c' } as RoomState['room'];
		jest.mocked(isInviteSubscription).mockReturnValue(true);

		renderGate();

		expect(screen.getByTestId('invited-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('keeps the room screen unmounted while the E2EE key is missing', () => {
		room.current = { rid: 'rid-1', t: 'c', encrypted: true } as RoomState['room'];
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: true, showE2EEDisabledRoom: false });

		renderGate();

		expect(screen.getByTestId('missing-key-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('keeps the room screen unmounted while the session has E2EE disabled', () => {
		room.current = { rid: 'rid-1', t: 'c', encrypted: true } as RoomState['room'];
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: false, showE2EEDisabledRoom: true });

		renderGate();

		expect(screen.getByTestId('encrypted-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});
});
