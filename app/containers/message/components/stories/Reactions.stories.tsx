import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import ReactionsLeaf from '../Reactions';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: 'Message with reactions',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false,
	reactions: [
		{ emoji: ':joy:', usernames: ['rocket.cat', 'diego.mello'] },
		{ emoji: ':heart:', usernames: ['diego.mello'] }
	]
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {
	user: { id: 'reader-id', username: 'rocket.cat' },
	onReactionPress: () => {},
	onReactionLongPress: () => {},
	reactionInit: () => {}
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Reactions'
};

// A message with reactions renders each reaction pill plus the add-reaction button.
export const Reactions = () => (
	<StoryWrapper>
		<ReactionsLeaf />
	</StoryWrapper>
);
