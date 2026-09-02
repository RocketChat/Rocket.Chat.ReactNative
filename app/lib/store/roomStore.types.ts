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
	// Per-run cancel token: a run whose signal aborts stops retrying and reports `skipped`, so a
	// superseded run can never write over the run that replaced it.
	signal?: AbortSignal;
}

// The distinct outcomes of one init() run. `skipped` means the run produced nothing the caller may
// act on: either no work was attempted (no rid, an invite subscription) or the run was aborted and
// abandoned, which can happen even after a successful load. Only `loaded` carries an unread divider
// anchor; `failed` means every attempt was made and none succeeded.
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
	// Resolves with the run's outcome; only `loaded` carries the screen's unread divider anchor.
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
