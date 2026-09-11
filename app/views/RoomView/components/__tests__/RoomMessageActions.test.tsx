import { createRef } from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'zustand';

import { ActionSheetProvider } from '../../../../containers/ActionSheet';
import { type IMessageActions } from '../../../../containers/MessageActions';
import { type IMessageErrorActions } from '../../../../containers/MessageErrorActions';
import { setUser } from '../../../../actions/login';
import { createMockedStore } from '../../../../reducers/mockedStore';
import { type RoomState } from '../../definitions';
import { RoomStoreContext } from '../../stores/RoomStoreContext';
import { RoomMessageActions } from '../RoomMessageActions';

const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c' };

const makeRoomStore = () =>
	createStore<RoomState>(() => ({
		room: subRoom,
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(),
		resumeRoom: jest.fn()
	}));

describe('RoomMessageActions', () => {
	it('populates both sheet handles on mount and clears them on unmount', () => {
		const messageActionsRef = createRef<IMessageActions>();
		const messageErrorActionsRef = createRef<IMessageErrorActions>();
		const roomStore = makeRoomStore();
		const reduxStore = createMockedStore();
		reduxStore.dispatch(setUser({ id: 'user-1', username: 'tester', roles: [] }));

		const { unmount } = render(
			<Provider store={reduxStore}>
				<ActionSheetProvider>
					<RoomStoreContext.Provider value={roomStore}>
						<RoomMessageActions
							tmid={undefined}
							messageActionsRef={messageActionsRef}
							messageErrorActionsRef={messageErrorActionsRef}
							editInit={jest.fn()}
							replyInit={jest.fn()}
							quoteInit={jest.fn()}
							reactionInit={jest.fn()}
							onReactionPress={jest.fn()}
							jumpToMessage={jest.fn()}
						/>
					</RoomStoreContext.Provider>
				</ActionSheetProvider>
			</Provider>
		);

		expect(messageActionsRef.current).toEqual(expect.objectContaining({ showMessageActions: expect.any(Function) }));
		expect(messageErrorActionsRef.current).toEqual(expect.objectContaining({ showMessageErrorActions: expect.any(Function) }));

		unmount();

		expect(messageActionsRef.current).toBeNull();
		expect(messageErrorActionsRef.current).toBeNull();
	});
});
