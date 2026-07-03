import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { selectServerRequest } from '../../../../actions/server';
import { type ICustomEmoji } from '../../../../definitions/IEmoji';
import EmojiLeaf from '../Emoji';

const store = createMockedStore();
store.dispatch(selectServerRequest('https://open.rocket.chat', '7.0.0'));

const standardEmojiStyle = { fontSize: 30 };
const customEmojiStyle = { width: 30, height: 30 };

export default {
	title: 'Message/Emoji'
};

// A shortname with no custom-emoji match renders as unicode text.
export const Emoji = () => (
	<Provider store={store}>
		<EmojiLeaf
			content=':grinning:'
			standardEmojiStyle={standardEmojiStyle}
			customEmojiStyle={customEmojiStyle}
			getCustomEmoji={() => null}
		/>
	</Provider>
);

// A shortname that matches a custom emoji renders the custom image.
export const EmojiCustom = () => (
	<Provider store={store}>
		<EmojiLeaf
			content=':react_rocket:'
			standardEmojiStyle={standardEmojiStyle}
			customEmojiStyle={customEmojiStyle}
			getCustomEmoji={(): ICustomEmoji => ({ name: 'react_rocket', extension: 'png' })}
		/>
	</Provider>
);
