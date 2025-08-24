import { TextInputProps } from 'react-native';

import { emojisByCategory } from '../../lib/constants';
import { IEmoji } from '../../definitions';

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
