import { type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';

import { type ChatsStackParamList } from '../../stacks/types';
import { type IBaseScreen, type IEmoji, type TAnyMessageModel } from '../../definitions';
import { type RoomState, type TRoomViewRoom } from '../../lib/store/definitions';

export type IRoomViewProps = Pick<IBaseScreen<ChatsStackParamList, 'RoomView'>, 'navigation' | 'route'>;

export interface IRoomViewState {
	room: TRoomViewRoom;
	roomUpdate: RoomState['roomUpdate'];
	member: any;
	lastSeen: Date | null;
}

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
	flatListRef: TListRef;
	jumpToBottom: () => void;
	isAnchored?: boolean;
}

export interface IListContainerRef {
	jumpToMessage: (messageId: string, highTs?: number | null) => Promise<void>;
	cancelJumpToMessage: () => void;
	isMessageInWindow: (messageId: string) => boolean;
}

export interface IRoomActions {
	onThreadPress: (item: TAnyMessageModel) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	sendMessage: (message?: string, tshow?: boolean) => void;
}

// The screen's own state, carried by RoomScreenContext — see that module for why it is per-screen.
export interface IRoomScreenContextValue {
	loading: boolean;
	failed: boolean;
	retry: () => void;
	lastSeen: IRoomViewState['lastSeen'];
	clearLastSeen: () => void;
}

export type TGetMessageInfoResult = {
	id: string;
	rid: string | undefined;
	tmid?: string;
	msg: string | undefined;
	ts: string | Date | number;
	replies?: string[];
	fromServer?: boolean;
};

export interface AnchorMessage {
	id: string;
	t?: string | null;
	ts: Date | number | string;
}

export interface IJoinCode {
	show: () => void;
}
