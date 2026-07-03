import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { selectServerRequest } from '../../../../actions/server';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import MessageAvatarLeaf from '../MessageAvatar';

const store = createMockedStore();
store.dispatch(selectServerRequest('https://open.rocket.chat', '7.0.0'));

const item = {
	id: 'msg-id',
	msg: 'Message',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {
	user: { id: 'reader-id', username: 'reader' },
	getCustomEmoji: () => null
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/MessageAvatar'
};

// Header messages render the author avatar from the username.
export const MessageAvatar = () => (
	<StoryWrapper>
		<MessageAvatarLeaf />
	</StoryWrapper>
);
