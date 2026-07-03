import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import MessageTimeLeaf from '../Time';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: '',
	ts: new Date('2024-01-01T10:20:00.000Z'),
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	timeFormat: 'LT'
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Time'
};

// The timestamp renders the message time using the room time format.
export const Time = () => (
	<StoryWrapper>
		<MessageTimeLeaf />
	</StoryWrapper>
);
