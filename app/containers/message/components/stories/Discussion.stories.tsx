import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import DiscussionLeaf from '../Discussion';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'Discussion topic message',
	dcount: 5,
	dlm: new Date('2024-01-01T10:20:00.000Z'),
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {
	user: { id: 'reader-id', username: 'reader' },
	onDiscussionPress: () => {}
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Discussion'
};

// A discussion message renders the started-discussion label, topic, reply count and last-message time.
export const Discussion = () => (
	<StoryWrapper>
		<DiscussionLeaf />
	</StoryWrapper>
);
