import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';

import MessagesView from '..';
import Navigation from '../../../lib/navigation/appNavigation';
import { getPinnedMessages } from '../../../lib/services/restApi';
import { mockedStore } from '../../../reducers/mockedStore';
import { type MessageRoomState } from '../../../containers/message/stores/MessageRoomStore';
import { SubscriptionType } from '../../../definitions';

jest.mock('../../../lib/services/restApi', () => ({
	getPinnedMessages: jest.fn(),
	getMessages: jest.fn(),
	getFiles: jest.fn(),
	togglePinMessage: jest.fn(),
	toggleStarMessage: jest.fn()
}));

jest.mock('../../../lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: { popToRoom: jest.fn(), setParams: jest.fn(), push: jest.fn() }
}));

let capturedRoomState: Partial<MessageRoomState> | undefined;

jest.mock('../../../containers/message/stores/MessageRoomStore', () => {
	const actual = jest.requireActual('../../../containers/message/stores/MessageRoomStore');
	return {
		...actual,
		MessageRoomProvider: ({ children, ...state }: { children: ReactNode } & Partial<MessageRoomState>) => {
			capturedRoomState = state;
			return <actual.MessageRoomProvider {...state}>{children}</actual.MessageRoomProvider>;
		}
	};
});

const renderMessagesView = () =>
	render(
		<Provider store={mockedStore}>
			<SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width: 390, height: 844 }}>
				<SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: 0, left: 0 }}>
					<MessagesView
						navigation={{ setOptions: jest.fn(), navigate: jest.fn() } as any}
						route={{ params: { rid: 'rid-1', t: SubscriptionType.CHANNEL, name: 'Pinned' } } as any}
					/>
				</SafeAreaInsetsContext.Provider>
			</SafeAreaFrameContext.Provider>
		</Provider>
	);

describe('MessagesView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		capturedRoomState = undefined;
		(getPinnedMessages as jest.Mock).mockResolvedValue({
			success: true,
			messages: [{ _id: 'msg-1', msg: 'pinned', u: { _id: 'u1', username: 'john' }, ts: new Date() }],
			total: 1
		});
	});

	test('jumps in-app for an in-server message link instead of opening a browser', async () => {
		renderMessagesView();

		await waitFor(() => expect(capturedRoomState?.rid).toBe('rid-1'));

		expect(capturedRoomState?.jumpToMessage).toBeDefined();

		capturedRoomState?.jumpToMessage?.('https://open.rocket.chat/channel/general?msg=msg-1');

		expect(Navigation.setParams).toHaveBeenCalledWith({ rid: 'rid-1', jumpToMessageId: 'msg-1', t: 'c' });
	});
});
