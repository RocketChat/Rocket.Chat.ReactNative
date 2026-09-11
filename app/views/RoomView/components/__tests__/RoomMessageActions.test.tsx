import { createRef, type RefObject } from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { createStore as createZustandStore } from 'zustand';

import { ActionSheetProvider } from '../../../../containers/ActionSheet';
import { type IMessageActions } from '../../../../containers/MessageActions';
import { type IMessageErrorActions } from '../../../../containers/MessageErrorActions';
import { type IRoomMessageActionsProps, type RoomStore } from '../../definitions';
import { RoomStoreContext } from '../../stores/RoomStoreContext';
import { RoomMessageActions } from '../RoomMessageActions';

const makeReduxStore = () =>
	createStore(() => ({
		login: { user: { id: 'user-1', username: 'tester', roles: [] } },
		server: { server: 'https://open.rocket.chat', version: '7.0.0' },
		settings: {},
		permissions: {},
		app: { isMasterDetail: false }
	}));

const makeProps = (
	messageActionsRef: RefObject<IMessageActions | null>,
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>
): IRoomMessageActionsProps =>
	({
		tmid: undefined,
		messageActionsRef,
		messageErrorActionsRef,
		editInit: jest.fn(),
		replyInit: jest.fn(),
		quoteInit: jest.fn(),
		reactionInit: jest.fn(),
		onReactionPress: jest.fn(),
		jumpToMessage: jest.fn()
	}) as IRoomMessageActionsProps;

const renderComponent = (
	messageActionsRef: RefObject<IMessageActions | null>,
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>
) => {
	const roomStore = createZustandStore(() => ({ room: { id: 'sub-1', rid: 'rid-1', t: 'c' } })) as unknown as RoomStore;
	const reduxStore = makeReduxStore();
	return render(
		<Provider store={reduxStore}>
			<ActionSheetProvider>
				<RoomStoreContext.Provider value={roomStore}>
					<RoomMessageActions {...makeProps(messageActionsRef, messageErrorActionsRef)} />
				</RoomStoreContext.Provider>
			</ActionSheetProvider>
		</Provider>
	);
};

describe('RoomMessageActions handle attachment', () => {
	it('populates both sheet handles on mount and clears them on unmount', () => {
		const messageActionsRef = createRef<IMessageActions>();
		const messageErrorActionsRef = createRef<IMessageErrorActions>();

		const screen = renderComponent(messageActionsRef, messageErrorActionsRef);

		expect(messageActionsRef.current).toEqual(expect.objectContaining({ showMessageActions: expect.any(Function) }));
		expect(messageErrorActionsRef.current).toEqual(expect.objectContaining({ showMessageErrorActions: expect.any(Function) }));

		screen.unmount();

		expect(messageActionsRef.current).toBeNull();
		expect(messageErrorActionsRef.current).toBeNull();
	});
});
