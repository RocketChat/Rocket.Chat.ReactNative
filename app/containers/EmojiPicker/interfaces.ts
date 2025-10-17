import { type ImageStyle, type StyleProp, type TextInputProps } from 'react-native';

import { type emojisByCategory } from '../../lib/constants/emojis';
import { type ICustomEmoji, type IEmoji } from '../../definitions';

export enum EventTypes {
	EMOJI_PRESSED = 'emojiPressed',
	BACKSPACE_PRESSED = 'backspacePressed',
	SEARCH_PRESSED = 'searchPressed'
}

export interface IEmojiPickerProps {
	onItemClicked: (event: EventTypes, emoji?: IEmoji) => void;
	isEmojiKeyboard?: boolean;
	searching?: boolean;
	searchedEmojis?: IEmoji[];
}

export interface IFooterProps {
	onBackspacePressed: () => void;
	onSearchPressed: () => void;
}

export type TEmojiCategory = keyof typeof emojisByCategory | 'frequentlyUsed' | 'custom';

export interface IEmojiCategoryProps {
	onEmojiSelected: (emoji: IEmoji) => void;
	parentWidth: number;
	category?: TEmojiCategory;
	emojis?: IEmoji[];
}

export interface IEmojiSearchBarProps {
	onBlur?: TextInputProps['onBlur'];
	onChangeText: TextInputProps['onChangeText'];
	bottomSheet?: boolean;
}

export interface ICustomEmojiProps {
	emoji: ICustomEmoji;
	style: StyleProp<ImageStyle>;
}

export interface IEmojiProps {
	emoji: IEmoji;
}
