import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { Provider } from 'react-redux';

import { ActionSheetProvider, useActionSheet } from '~/containers/ActionSheet';
import { SubscriptionType } from '~/definitions';
import { initStore } from '~/lib/store/auxStore';
import { mockedStore } from '~/reducers/mockedStore';
import ConferenceChatSheetContent from '../ConferenceChatSheetContent';

jest.mock('~/views/RoomView/components/RoomViewContent/RoomViewContent', () => ({
	RoomViewContent: () => mockRoomViewContent()
}));
jest.mock('~/views/RoomView/stores/RoomStore', () => ({
	createRoomStore: jest.fn(() => 'room-store'),
	observeRoom: jest.fn(() => () => undefined)
}));

const MessageThatOpensMenus = () => {
	const { showActionSheet } = useActionSheet();
	return (
		<Pressable testID='long-press-message' onPress={() => showActionSheet({ children: <Text>message menu</Text> })}>
			<Text>a message</Text>
		</Pressable>
	);
};

const mockRoomViewContent = () => <MessageThatOpensMenus />;

const OpenChat = () => {
	const { showActionSheet } = useActionSheet();
	return (
		<Pressable
			testID='open-chat'
			onPress={() =>
				showActionSheet({
					children: (
						<ConferenceChatSheetContent rid='GENERAL' t={SubscriptionType.CHANNEL} name='general' title='Standup' canRead />
					),
					snaps: ['90%', '100%'],
					fullContainer: true
				})
			}>
			<Text>open chat</Text>
		</Pressable>
	);
};

describe('a menu opened from inside the chat sheet', () => {
	beforeEach(() => {
		initStore(mockedStore);
	});

	it('shows over the chat instead of replacing it', () => {
		const { getByTestId, getByText, queryByText } = render(
			<Provider store={mockedStore}>
				<ActionSheetProvider>
					<OpenChat />
				</ActionSheetProvider>
			</Provider>
		);
		fireEvent.press(getByTestId('open-chat'));
		expect(getByText('Standup')).toBeTruthy();
		expect(queryByText('message menu')).toBeNull();

		fireEvent.press(getByTestId('long-press-message'));

		expect(getByText('message menu')).toBeTruthy();
		expect(getByText('Standup')).toBeTruthy();
		expect(getByText('a message')).toBeTruthy();
	});
});
