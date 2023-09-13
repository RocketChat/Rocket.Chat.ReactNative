import { RefObject } from 'react';
import { FlatListProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

export type TListRef = RefObject<FlatList & { getNode: () => FlatList }>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<any> {
	listRef: TListRef;
	jumpToBottom: () => void;
	isThread: boolean;
}

export interface IListContainerRef {
	jumpToMessage: (messageId: string) => Promise<void>;
	cancelJumpToMessage: () => void;
}

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	tmid?: string;
	loading: boolean;
	listRef: TListRef;
	hideSystemMessages: string[];
	tunread?: string[];
	ignored?: string[];
	navigation: any; // TODO: type me
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
}
