import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore as createReduxStore } from 'redux';

import RoomView from '../index';
import { type IRoomViewProps } from '../definitions';
import { type TRoomOrPreview } from '../../../definitions/TRoom';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { useE2EEStatus } from '../hooks/useE2EEStatus';

jest.mock('../RoomScreen', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { __esModule: true, default: () => createElement(RNView, { testID: 'room-screen' }) };
});
jest.mock('../components/InvitedRoomScreen', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { InvitedRoomScreen: () => createElement(RNView, { testID: 'invited-screen' }) };
});
jest.mock('../components/MissingRoomE2EEKey', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { MissingRoomE2EEKey: () => createElement(RNView, { testID: 'missing-key-screen' }) };
});
jest.mock('../components/EncryptedRoom', () => {
	const { createElement } = require('react');
	const { View: RNView } = require('react-native');
	return { EncryptedRoom: () => createElement(RNView, { testID: 'encrypted-screen' }) };
});
jest.mock('../hooks/useHeader', () => ({ useHeader: jest.fn() }));
jest.mock('../hooks/useE2EEStatus', () => ({
	useE2EEStatus: jest.fn(() => ({ showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false }))
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../../lib/methods/helpers', () => ({ getUidDirectMessage: jest.fn(), getRoomTitle: jest.fn(() => 'Room Title') }));

const room: { current: TRoomOrPreview } = { current: { rid: 'rid-1', t: 'c' } };

jest.mock('../stores/RoomStore', () => {
	const { createStore } = require('zustand');
	const store = createStore(() => ({ room: {} }));
	return {
		createRoomStore: () => {
			store.setState({ room: room.current }, true);
			return store;
		},
		observeRoom: (_rid: string, _store: unknown, onReady: () => void) => {
			onReady();
			return jest.fn();
		}
	};
});

const renderRoomView = (params: Record<string, unknown> | null = { rid: 'rid-1', t: 'c' }) => {
	const reduxStore = createReduxStore(() => ({ server: { version: '6.1.0' } }));
	const route = { params: params ?? undefined } as unknown as IRoomViewProps['route'];
	const navigation = { setOptions: jest.fn() } as unknown as IRoomViewProps['navigation'];
	return render(
		<Provider store={reduxStore}>
			<View>
				<RoomView route={route} navigation={navigation} />
			</View>
		</Provider>
	);
};

describe('RoomView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		room.current = { rid: 'rid-1', t: 'c' };
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false });
		jest.mocked(isInviteSubscription).mockReturnValue(false);
	});

	it('mounts the room screen when the room is not blocked', () => {
		renderRoomView();

		expect(screen.getByTestId('room-screen')).toBeOnTheScreen();
	});

	it('renders the empty-room background instead of a room when the route has no identity', () => {
		renderRoomView(null);

		expect(screen.getByTestId('room-view-empty')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('renders the empty-room background when the route has a rid but no type', () => {
		renderRoomView({ rid: 'rid-1' });

		expect(screen.getByTestId('room-view-empty')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('keeps the room screen unmounted while the room is an invite', () => {
		room.current = { id: 'sub-1', rid: 'rid-1', t: 'c' } as TRoomOrPreview;
		jest.mocked(isInviteSubscription).mockReturnValue(true);

		renderRoomView();

		expect(screen.getByTestId('invited-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('keeps the room screen unmounted while the E2EE key is missing', () => {
		room.current = { id: 'sub-1', rid: 'rid-1', t: 'c', encrypted: true } as TRoomOrPreview;
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: true, showE2EEDisabledRoom: false, hasE2EEWarning: true });

		renderRoomView();

		expect(screen.getByTestId('missing-key-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});

	it('keeps the room screen unmounted while the session has E2EE disabled', () => {
		room.current = { id: 'sub-1', rid: 'rid-1', t: 'c', encrypted: true } as TRoomOrPreview;
		jest.mocked(useE2EEStatus).mockReturnValue({ showMissingE2EEKey: false, showE2EEDisabledRoom: true, hasE2EEWarning: true });

		renderRoomView();

		expect(screen.getByTestId('encrypted-screen')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-screen')).toBeNull();
	});
});
