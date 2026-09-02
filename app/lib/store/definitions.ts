import { type StoreApi } from 'zustand';

import { type ILastMessage, type IVisitor, type TSubscriptionModel } from '../../definitions';

export type TRoomUpdate = keyof TSubscriptionModel;

export type TRoomViewRoom =
	| TSubscriptionModel
	| {
			rid: string;
			t: string;
			name?: string;
			fname?: string;
			prid?: string;
			visitor?: IVisitor;
			joinCodeRequired?: boolean;
			status?: string;
			lastMessage?: ILastMessage;
			sysMes?: boolean;
			onHold?: boolean;
	  };

export interface IRoomStoreInitParams {
	tmid?: string;
	onThreadMessagesLoaded?: () => void;
	signal?: AbortSignal;
}

export type TRoomInitResult = { status: 'loaded'; lastSeen: Date | null } | { status: 'skipped' } | { status: 'failed' };

export interface RoomState {
	room: TRoomViewRoom;
	roomUpdate: Partial<Pick<TSubscriptionModel, TRoomUpdate>>;
	joined: boolean;
	subscribed: boolean;
	member: any;
	roomUserId?: string | null;
	canAutoTranslate: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
	lastMessageFromAgent: boolean;
	init: (params?: IRoomStoreInitParams) => Promise<TRoomInitResult>;
	join: () => void;
	joinRoom: (requestJoinCode?: () => void) => Promise<void>;
	resumeRoom: () => Promise<void>;
}

export type RoomStore = StoreApi<RoomState>;

export interface IGetOrCreateRoomStoreParams {
	rid?: string;
	t?: string;
	initialRoom: TRoomViewRoom;
	roomUserId?: string | null;
	serverVersion?: string | null;
}
