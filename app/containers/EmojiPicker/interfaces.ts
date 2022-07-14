import { StyleProp, TextStyle } from 'react-native';

import { IEmoji } from '../../definitions';

export enum EventTypes {
	EMOJI_PRESSED = 'emojiPressed',
	BACKSPACE_PRESSED = 'backspacePressed',
	SEARCH_PRESSED = 'searchPressed'
}

export interface IEmojiPickerProps {
	onItemClicked: (event: EventTypes, emoji?: string, shortname?: string) => void;
	tabEmojiStyle?: StyleProp<TextStyle>;
	isEmojiKeyboard?: boolean;
	searching?: boolean;
	searchedEmojis?: (string | IEmoji)[];
}

export interface IFooterProps {
	onBackspacePressed: () => void;
	onSearchPressed: () => void;
}

export interface ITabBarProps {
	goToPage?: (page: number) => void;
	activeTab?: number;
	tabs?: string[];
	tabEmojiStyle: StyleProp<TextStyle>;
}
