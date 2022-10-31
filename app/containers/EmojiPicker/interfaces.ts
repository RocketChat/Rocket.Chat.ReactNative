import { TIconsName } from '../CustomIcon';
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

export interface ITabBarProps {
	goToPage?: (page: number) => void;
	activeTab?: number;
	tabs?: TIconsName[];
}
