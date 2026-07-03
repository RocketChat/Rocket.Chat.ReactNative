import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../../definitions';
import { MessageRoomProvider, pickMessageRoomState } from '../../../stores/MessageRoomStore';
import { MessageProvider } from '../../../stores/MessageStore';
import TranslatedLeaf from '../../RightIcons/Translated';

const store = createMockedStore();

const translatedItem = {
	id: 'msg-id',
	msg: 'Original message',
	autoTranslate: true,
	translations: [{ _id: 'translation-1', language: 'en', value: 'Translated text' }],
	u: { _id: 'author-id', username: 'other.user' }
} as unknown as TAnyMessageModel;

const plainItem = {
	id: 'msg-id',
	msg: 'Original message',
	autoTranslate: false,
	u: { _id: 'author-id', username: 'other.user' }
} as unknown as TAnyMessageModel;

const StoryWrapper = ({ item, room, children }: { item: TAnyMessageModel; room: Record<string, any>; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...pickMessageRoomState(room)}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/RightIcons/Translated'
};

// An auto-translated message from another user renders the language icon.
export const Translated = () => (
	<StoryWrapper
		item={translatedItem}
		room={{ user: { id: 'reader-id', username: 'rocket.cat' }, autoTranslateRoom: true, autoTranslateLanguage: 'en' }}>
		<TranslatedLeaf />
	</StoryWrapper>
);

// A message that is not translated renders nothing.
export const TranslatedHidden = () => (
	<StoryWrapper item={plainItem} room={{ user: { id: 'reader-id', username: 'rocket.cat' } }}>
		<TranslatedLeaf />
	</StoryWrapper>
);
