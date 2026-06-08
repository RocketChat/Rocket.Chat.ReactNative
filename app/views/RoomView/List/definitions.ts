import { type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';

import { type RoomType, type TAnyMessageModel } from '../../../definitions';

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
	listRef: TListRef;
	jumpToBottom: () => void;
	// True while the Message Window is an Anchored (historical) Window. The bottom edge of the loaded
	// rows is NOT the Live Tail there, so the scroll-offset heuristic alone would hide the jump-to-bottom
	// FAB exactly where the user needs it. Keep it visible whenever anchored so "back to live" is one tap.
	isAnchored?: boolean;
}

export interface IListContainerRef {
	// highTs is the upper ts bound (ms) for an Anchored Window centered on the target's Chunk, or
	// null/undefined to keep a Live Window (contiguous / thread / local targets).
	jumpToMessage: (messageId: string, highTs?: number | null) => Promise<void>;
	cancelJumpToMessage: () => void;
	// True when messageId is in the currently-rendered Message Window. Lets the jump orchestration skip
	// re-anchoring (and the visible re-seed) for an already-visible target, so a quoted reply to a nearby
	// message still scrolls in place and the Live Tail is left intact.
	isMessageInWindow: (messageId: string) => boolean;
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
