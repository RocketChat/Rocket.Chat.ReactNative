import { RefObject } from 'react';
import { FlatListProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { TAnyMessageModel } from '../../../definitions';

export type TListRef = RefObject<FlatList<TAnyMessageModel>>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
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
	showMessageInMainThread: boolean;
	serverVersion: string | null;
}
