import { TIconsName } from '../CustomIcon';
import { IEmoji } from '../../definitions';

export enum EventTypes {
	EMOJI_PRESSED = 'emojiPressed',
	BACKSPACE_PRESSED = 'backspacePressed',
	SEARCH_PRESSED = 'searchPressed'
}

export interface IEmojiPickerProps {
	onItemClicked: (event: EventTypes, emoji?: string, shortname?: string) => void;
	isEmojiKeyboard?: boolean;
	searching?: boolean;
	searchedEmojis?: (string | IEmoji)[];
}

export interface IFooterProps {
	onBackspacePressed: () => void;
	onSearchPressed: () => void;
}

export interface ITabBarProps {
	activeTab?: number;
	tabs?: { key: TIconsName; title: string }[];
	onPress: (ket: string) => void;
	showFrequentlyUsed?: boolean;
}
