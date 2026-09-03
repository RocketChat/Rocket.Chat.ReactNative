import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { updateSettings } from '../../../../actions/settings';
import { setUser } from '../../../../actions/login';
import { selectServerSuccess } from '../../../../actions/server';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import UrlsLeaf from '../Urls';

const store = createMockedStore();
store.dispatch(updateSettings('API_Embed', true));
store.dispatch(setUser({ id: 'reader-id', username: 'reader', token: 'token' }));
store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '', name: '' }));

const item = {
	id: 'msg-id',
	msg: '',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false,
	urls: [
		{
			url: 'https://rocket.chat',
			title: 'Rocket.Chat',
			description: 'Have your own chat service on-premises or in the cloud',
			image: ''
		}
	]
} as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {};

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Urls'
};

// A message with an embeddable URL renders the link preview card.
export const Urls = () => (
	<StoryWrapper>
		<UrlsLeaf />
	</StoryWrapper>
);
