import { StyleProp, TextStyle } from 'react-native';

export enum EventTypes {
	EMOJI_PRESSED = 'emojiPressed',
	BACKSPACE_PRESSED = 'backspacePressed',
	SEARCH_PRESSED = 'searchPressed'
}

export interface IEmojiPickerProps {
	baseUrl: string;
	onItemClicked: (event: EventTypes, emoji?: string) => void;
	tabEmojiStyle?: StyleProp<TextStyle>;
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
