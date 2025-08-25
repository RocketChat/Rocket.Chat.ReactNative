import { RefObject } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { FlashListProps } from '@shopify/flash-list';

import { TAnyMessageModel } from '../../../definitions';

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlashListProps<TAnyMessageModel> {
	listRef: TListRef;
	jumpToBottom: () => void;
}

export interface IListContainerRef {
	jumpToMessage: (messageId: string) => Promise<void>;
	cancelJumpToMessage: () => void;
}

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	tmid?: string;
	listRef: TListRef;
	hideSystemMessages: string[];
	showMessageInMainThread: boolean;
	serverVersion: string | null;
}
