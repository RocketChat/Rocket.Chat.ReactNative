import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import ContentLeaf from '../Content';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'This is a plain text message',
	t: undefined,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	user: { id: 'reader-id', username: 'reader' },
	getCustomEmoji: () => null
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Content'
};

// A regular text message renders its Markdown body.
export const Content = () => (
	<StoryWrapper>
		<ContentLeaf />
	</StoryWrapper>
);
