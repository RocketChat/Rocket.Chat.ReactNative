import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { MessageRoomProvider } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import PinnedLeaf from '../../RightIcons/Pinned';

const store = createMockedStore();

const pinnedItem = {
	id: 'msg-id',
	msg: 'Pinned message',
	pinned: true,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const unpinnedItem = {
	id: 'msg-id',
	msg: 'Regular message',
	pinned: false,
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
	title: 'Message/RightIcons/Pinned'
};

// A pinned message renders the pin icon.
export const Pinned = () => (
	<StoryWrapper item={pinnedItem}>
		<PinnedLeaf />
	</StoryWrapper>
);

// A non-pinned message renders nothing.
export const PinnedHidden = () => (
	<StoryWrapper item={unpinnedItem}>
		<PinnedLeaf />
	</StoryWrapper>
);
