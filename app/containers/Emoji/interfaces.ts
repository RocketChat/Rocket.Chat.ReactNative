import { ImageStyle, StyleProp } from 'react-native';

import { ICustomEmoji, IEmoji } from '../../definitions';

export interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ImageStyle>;
}

export interface IEmojiProps {
	emoji: IEmoji;
}
