import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { selectServerRequest } from '../../../../actions/server';
import { setCustomEmojis } from '../../../../actions/customEmojis';
import EmojiLeaf from '../Emoji';

const store = createMockedStore();
store.dispatch(selectServerRequest('https://open.rocket.chat', '7.0.0'));

const storeWithCustomEmoji = createMockedStore();
storeWithCustomEmoji.dispatch(selectServerRequest('https://open.rocket.chat', '7.0.0'));
storeWithCustomEmoji.dispatch(setCustomEmojis({ react_rocket: { name: 'react_rocket', extension: 'png' } }));

const standardEmojiStyle = { fontSize: 30 };
const customEmojiStyle = { width: 30, height: 30 };

export default {
	title: 'Message/Emoji'
};

// A shortname with no custom-emoji match renders as unicode text.
export const Emoji = () => (
	<Provider store={store}>
		<EmojiLeaf content=':grinning:' standardEmojiStyle={standardEmojiStyle} customEmojiStyle={customEmojiStyle} />
	</Provider>
);

// A shortname that matches a custom emoji renders the custom image.
export const EmojiCustom = () => (
	<Provider store={storeWithCustomEmoji}>
		<EmojiLeaf content=':react_rocket:' standardEmojiStyle={standardEmojiStyle} customEmojiStyle={customEmojiStyle} />
	</Provider>
);
