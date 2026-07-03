import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { E2E_MESSAGE_TYPE } from '../../../../../lib/constants/keys';
import { MessageRoomProvider, pickMessageRoomState } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import EncryptedLeaf from '../../RightIcons/Encrypted';

const store = createMockedStore();

const encryptedItem = {
	id: 'msg-id',
	msg: 'Encrypted message',
	t: E2E_MESSAGE_TYPE,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const plainItem = {
	id: 'msg-id',
	msg: 'Plain message',
	t: undefined,
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const room = {
	onEncryptedPress: () => {}
};

const StoryWrapper = ({ item, children }: { item: TAnyMessageModel; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RightIcons/Encrypted'
};

// An E2E message renders the encrypted icon.
export const Encrypted = () => (
	<StoryWrapper item={encryptedItem}>
		<EncryptedLeaf />
	</StoryWrapper>
);

// A non-encrypted message renders nothing.
export const EncryptedHidden = () => (
	<StoryWrapper item={plainItem}>
		<EncryptedLeaf />
	</StoryWrapper>
);
