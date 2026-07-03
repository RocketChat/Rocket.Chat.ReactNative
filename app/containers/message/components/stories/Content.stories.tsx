import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
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
	title: 'Message/Content'
};

// A regular text message renders its Markdown body.
export const Content = () => (
	<StoryWrapper>
		<ContentLeaf />
	</StoryWrapper>
);
