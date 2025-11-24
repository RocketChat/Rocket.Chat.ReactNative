import { type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';
import { LegendListProps, LegendListRef } from '@legendapp/list';

import { type TAnyMessageModel } from '../../../definitions';

export type TListRef = RefObject<LegendListRef | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export type IListProps = LegendListProps<TAnyMessageModel> & {
	listRef: TListRef;
	jumpToBottom: () => void;
};

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
