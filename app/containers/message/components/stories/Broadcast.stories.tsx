import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { setUser } from '../../../../actions/login';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import BroadcastLeaf from '../Broadcast';

const store = createMockedStore();
store.dispatch(setUser({ id: 'reader-id', username: 'rocket.cat' }));

const otherAuthorItem = {
	id: 'msg-id',
	msg: 'Broadcast message',
	u: { _id: 'author-id', username: 'other.user' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const ownAuthorItem = {
	id: 'msg-id',
	msg: 'Broadcast message',
	u: { _id: 'reader-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {
	broadcast: true
};

const StoryWrapper = ({ item, children }: { item: TAnyMessageModel; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Broadcast'
};

// A broadcast message from another user renders the reply button.
export const Broadcast = () => (
	<StoryWrapper item={otherAuthorItem}>
		<BroadcastLeaf />
	</StoryWrapper>
);

// A broadcast message authored by the reader renders nothing.
export const BroadcastOwn = () => (
	<StoryWrapper item={ownAuthorItem}>
		<BroadcastLeaf />
	</StoryWrapper>
);
