import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { messagesStatus } from '../../../../../lib/constants/messagesStatus';
import { MessageRoomProvider, pickMessageRoomState } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import MessageErrorLeaf from '../../RightIcons/MessageError';

const store = createMockedStore();

const errorItem = {
	id: 'msg-id',
	msg: 'Message that failed to send',
	status: messagesStatus.ERROR,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const okItem = {
	id: 'msg-id',
	msg: 'Message that sent fine',
	status: messagesStatus.SENT,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	errorActionsShow: () => {}
};

const StoryWrapper = ({ item, children }: { item: TAnyMessageModel; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RightIcons/MessageError'
};

// A message in error status renders the warning icon.
export const MessageError = () => (
	<StoryWrapper item={errorItem}>
		<MessageErrorLeaf />
	</StoryWrapper>
);

// A message without an error renders nothing.
export const MessageErrorHidden = () => (
	<StoryWrapper item={okItem}>
		<MessageErrorLeaf />
	</StoryWrapper>
);
