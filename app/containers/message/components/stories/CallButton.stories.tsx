import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import CallButtonLeaf from '../CallButton';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: '',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	handleEnterCall: () => {}
};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/CallButton'
};

// The join-call button always renders its label and video icon.
export const CallButton = () => (
	<StoryWrapper>
		<CallButtonLeaf />
	</StoryWrapper>
);
