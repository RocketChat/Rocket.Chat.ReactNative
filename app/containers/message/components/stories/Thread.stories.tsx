import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import ThreadLeaf from '../Thread';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'Thread parent message',
	tcount: 3,
	tlm: new Date('2024-01-01T10:20:00.000Z'),
	replies: ['user-1', 'user-2', 'user-3'],
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	user: { id: 'reader-id', username: 'reader' },
	onThreadPress: () => {},
	isThreadRoom: false
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Thread'
};

// A message with thread replies renders the View Thread button and thread details.
export const Thread = () => (
	<StoryWrapper>
		<ThreadLeaf />
	</StoryWrapper>
);
