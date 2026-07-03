import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { MessageRoomProvider } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import EditedLeaf from '../../RightIcons/Edited';

const store = createMockedStore();

const editedItem = {
	id: 'msg-id',
	msg: 'Edited message',
	editedBy: { username: 'rocket.cat' },
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const plainItem = {
	id: 'msg-id',
	msg: 'Untouched message',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const StoryWrapper = ({ item, children }: { item: TAnyMessageModel; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RightIcons/Edited'
};

// An edited message renders the edit icon.
export const Edited = () => (
	<StoryWrapper item={editedItem}>
		<EditedLeaf />
	</StoryWrapper>
);

// A message that was never edited renders nothing.
export const EditedHidden = () => (
	<StoryWrapper item={plainItem}>
		<EditedLeaf />
	</StoryWrapper>
);
