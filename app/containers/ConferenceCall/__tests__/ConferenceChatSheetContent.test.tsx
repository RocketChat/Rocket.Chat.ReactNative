import { useNavigation, useRoute } from '@react-navigation/native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import { SubscriptionType } from '~/definitions';
import { initStore } from '~/lib/store/auxStore';
import { mockedStore } from '~/reducers/mockedStore';
import { createRoomStore, observeRoom } from '~/views/RoomView/stores/RoomStore';
import ConferenceChatSheetContent from '../ConferenceChatSheetContent';

const mockActionSheet = { showActionSheet: jest.fn(), hideActionSheet: jest.fn() };

jest.mock('@react-navigation/native', () => jest.requireActual('@react-navigation/native'));
const mockRoomViewContent = jest.fn();

jest.mock('~/containers/ActionSheet', () => {
	const { createElement } = jest.requireActual('react');
	const { View: MockView } = jest.requireActual('react-native');
	return {
		useActionSheet: jest.fn(() => mockActionSheet),
		ActionSheetProvider: ({ children }: { children: unknown }) =>
			createElement(MockView, { testID: 'nested-action-sheet-provider' }, children)
	};
});
jest.mock('~/views/RoomView/components/RoomViewContent/RoomViewContent', () => ({
	RoomViewContent: (props: unknown) => mockRoomViewContent(props)
}));
jest.mock('~/views/RoomView/stores/RoomStore', () => ({
	createRoomStore: jest.fn(() => 'room-store'),
	observeRoom: jest.fn()
}));

const unsubscribe = jest.fn();

const RoomProbe = ({ ready, tmid }: { ready: boolean; tmid?: string }) => {
	const navigation = useNavigation();
	const route = useRoute();
	return (
		<View testID='room-probe'>
			<Text testID='probe-ready'>{String(ready)}</Text>
			<Text testID='probe-tmid'>{String(tmid)}</Text>
			<Text testID='probe-route'>{`${route.name} ${JSON.stringify(route.params)}`}</Text>
			<Text testID='probe-focused'>{String(navigation.isFocused())}</Text>
		</View>
	);
};

const renderSheet = (props: Partial<React.ComponentProps<typeof ConferenceChatSheetContent>> = {}) =>
	render(
		<ConferenceChatSheetContent rid='GENERAL' t={SubscriptionType.CHANNEL} name='general' title='Standup' canRead {...props} />
	);

describe('ConferenceChatSheetContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		initStore(mockedStore);
		(useActionSheet as jest.Mock).mockReturnValue(mockActionSheet);
		(observeRoom as jest.Mock).mockReturnValue(unsubscribe);
		mockRoomViewContent.mockImplementation(({ ready, tmid }) => <RoomProbe ready={ready} tmid={tmid} />);
	});

	describe('the chat', () => {
		it('is the room, titled with the name of the meeting, and has no close button', () => {
			const { getByText, queryByLabelText } = renderSheet();

			expect(getByText('Standup')).toBeTruthy();
			expect(queryByLabelText('Close')).toBeNull();
		});

		it('is the thread, still titled with the name of the meeting, when the call chats in one', () => {
			const { getByText, queryByText, getByTestId } = renderSheet({ tmid: 'started-message' });

			expect(getByText('Standup')).toBeTruthy();
			expect(queryByText('Thread')).toBeNull();
			expect(getByTestId('probe-tmid').props.children).toBe('started-message');
		});

		it('gives the room the navigation and route a screen of its own would', () => {
			const { getByTestId } = renderSheet({ tmid: 'started-message' });

			expect(getByTestId('probe-route').props.children).toBe(
				`RoomView ${JSON.stringify({ rid: 'GENERAL', t: 'c', name: 'general', tmid: 'started-message' })}`
			);
			expect(getByTestId('probe-focused').props.children).toBe('true');
		});

		it('opens the menus of the messages in a sheet of its own, so they do not replace the chat', () => {
			const { getByTestId } = renderSheet();

			expect(within(getByTestId('nested-action-sheet-provider')).getByTestId('room-probe')).toBeTruthy();
		});
	});

	describe('the room behind it', () => {
		it('is built from the chat, as a screen of its own would be', () => {
			renderSheet({ t: SubscriptionType.GROUP, name: 'team' });

			expect(createRoomStore).toHaveBeenCalledWith(
				expect.objectContaining({
					rid: 'GENERAL',
					initialRoom: expect.objectContaining({ rid: 'GENERAL', t: 'p', name: 'team' })
				})
			);
			expect(mockRoomViewContent).toHaveBeenCalledWith(
				expect.objectContaining({ rid: 'GENERAL', t: 'p', roomStore: 'room-store', ready: false })
			);
		});

		it('is ready once the room has been found', () => {
			const { getByTestId } = renderSheet();
			expect(getByTestId('probe-ready').props.children).toBe('false');

			act(() => (observeRoom as jest.Mock).mock.calls[0][2]());

			expect(getByTestId('probe-ready').props.children).toBe('true');
		});

		it('is watched while the sheet is open, and let go of when it closes', () => {
			const { unmount } = renderSheet();
			expect(observeRoom).toHaveBeenCalledWith('GENERAL', 'room-store', expect.any(Function));

			unmount();

			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});
	});

	describe('when the chat has not been shared with the viewer', () => {
		it('says so, and offers to close, instead of loading a room they cannot read', () => {
			const { getByText, getByTestId, queryByTestId } = renderSheet({ canRead: false });

			expect(getByText('This chat has not been shared with you')).toBeTruthy();
			expect(queryByTestId('room-probe')).toBeNull();
			expect(createRoomStore).not.toHaveBeenCalled();

			fireEvent.press(getByTestId('conference-chat-not-shared-close'));
			expect(mockActionSheet.hideActionSheet).toHaveBeenCalledTimes(1);
		});
	});
});
