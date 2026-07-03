import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import UserLeaf from '../User';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'Message',
	t: undefined,
	ts: new Date('2024-01-01T10:20:00.000Z'),
	u: { _id: 'author-id', username: 'rocket.cat', name: 'Rocket Cat' },
	alias: undefined,
	role: undefined,
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {
	user: { id: 'reader-id', username: 'reader' },
	timeFormat: 'LT'
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/User'
};

// The header renders the username, timestamp and right icons row.
export const User = () => (
	<StoryWrapper>
		<UserLeaf />
	</StoryWrapper>
);
