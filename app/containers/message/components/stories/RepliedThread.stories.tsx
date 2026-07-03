import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import RepliedThreadLeaf from '../RepliedThread';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'Thread reply body',
	tmid: 'thread-1',
	tmsg: 'Original thread message',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState({})}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RepliedThread'
};

// A header message that replies to a thread renders the replied-thread preview.
export const RepliedThread = () => (
	<StoryWrapper>
		<RepliedThreadLeaf isHeader />
	</StoryWrapper>
);
