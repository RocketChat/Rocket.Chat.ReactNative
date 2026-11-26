import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createMockedStore } from '~/reducers/mockedStore';
import { updateSettings } from '~/actions/settings';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type TAnyMessageModel } from '~/definitions/IMessage';
import { type IUrl, type IUrlFromServer } from '~/definitions/IUrl';
import parseUrls from '~/lib/methods/helpers/parseUrls';
import { MessageRoomProvider, type MessageRoomState } from '~/containers/message/stores/MessageRoomStore';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import UrlsLeaf from '../Urls';

const store = createMockedStore();
store.dispatch(updateSettings('API_Embed', true));
store.dispatch(setUser({ id: 'reader-id', username: 'reader', token: 'token' }));
store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '', name: '' }));

const rocketChatUrl = {
	url: 'https://rocket.chat',
	title: 'Rocket.Chat',
	description: 'Have your own chat service on-premises or in the cloud',
	image: ''
} as IUrl;

const xPostFromServer = {
	url: 'https://x.com/reactnative/status/1578332414145105921',
	meta: {
		oembedUrl: 'https://x.com/reactnative/status/1578332414145105921',
		oembedAuthorName: 'React Native',
		oembedAuthorUrl: 'https://x.com/reactnative',
		oembedHtml:
			'<blockquote class="twitter-tweet"><p lang="en" dir="ltr">We&#39;re happy to share that our website <a href="https://t.co/Msd34gULf5">https://t.co/Msd34gULf5</a> is now fully bilingual: Java &amp; <a href="https://x.com/hashtag/Kotlin?src=hash&amp;ref_src=twsrc%5Etfw">#Kotlin</a> 🚀<br><br>You will find snippets and examples in both languages side by side!<br><br>Kotlin makes for a more concise and more elegant experience when writing your native modules &amp; components.</p>&mdash; React Native (@reactnative) <a href="https://x.com/reactnative/status/1578332414145105921?ref_src=twsrc%5Etfw">October 7, 2022</a></blockquote>\n<script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>\n\n',
		oembedType: 'rich',
		oembedProviderName: 'X',
		oembedProviderUrl: 'https://x.com'
	}
} as unknown as IUrlFromServer;

const buildItem = (urls: IUrl[]) =>
	({
		id: 'msg-id',
		msg: '',
		u: { _id: 'author-id', username: 'rocket.cat' },
		autoTranslate: false,
		urls
	}) as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = {};

const StoryWrapper = ({ urls, children }: { urls: IUrl[]; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...room}>
			<MessageProvider item={buildItem(urls)}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

export default {
	title: 'Message/Urls'
};

// A message with an embeddable URL renders the link preview card.
export const Urls = () => (
	<StoryWrapper urls={[rocketChatUrl]}>
		<UrlsLeaf />
	</StoryWrapper>
);

// An X post preview comes as rich oEmbed: the card shows the author and the post text from the embed html.
export const XPost = () => (
	<StoryWrapper urls={parseUrls([xPostFromServer])}>
		<UrlsLeaf />
	</StoryWrapper>
);
