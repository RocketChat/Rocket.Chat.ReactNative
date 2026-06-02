import { type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';

import { type RoomType, type TAnyMessageModel } from '../../../definitions';

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
	listRef: TListRef;
	jumpToBottom: () => void;
}

export interface IListContainerRef {
	// highTs is the upper ts bound (ms) for an Anchored Window centered on the target's Chunk, or
	// null/undefined to keep a Live Window (contiguous / thread / local targets).
	jumpToMessage: (messageId: string, highTs?: number | null) => Promise<void>;
	cancelJumpToMessage: () => void;
}

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	t: RoomType;
	tmid?: string;
	listRef: TListRef;
	hideSystemMessages: string[];
	showMessageInMainThread: boolean;
	serverVersion: string | null;
}
