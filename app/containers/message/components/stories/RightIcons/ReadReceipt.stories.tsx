import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import ReadReceiptLeaf from '../../RightIcons/ReadReceipt';

const store = createMockedStore();

const readItem = {
	id: 'msg-id',
	msg: 'Read message',
	unread: false,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const unreadItem = {
	id: 'msg-id',
	msg: 'Unread message',
	unread: true,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const StoryWrapper = ({ item, room, children }: { item: TAnyMessageModel; room: Record<string, any>; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RightIcons/ReadReceipt'
};

// With read receipts enabled, a read message renders the double-check icon.
export const ReadReceipt = () => (
	<StoryWrapper item={readItem} room={{ isReadReceiptEnabled: true }}>
		<ReadReceiptLeaf />
	</StoryWrapper>
);

// With read receipts enabled, an unread message renders the single-check icon.
export const ReadReceiptUnread = () => (
	<StoryWrapper item={unreadItem} room={{ isReadReceiptEnabled: true }}>
		<ReadReceiptLeaf />
	</StoryWrapper>
);

// With read receipts disabled, nothing renders.
export const ReadReceiptHidden = () => (
	<StoryWrapper item={readItem} room={{ isReadReceiptEnabled: false }}>
		<ReadReceiptLeaf />
	</StoryWrapper>
);
