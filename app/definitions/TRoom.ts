import { type ILastMessage } from './IMessage';
import { type RoomType } from './IRoom';
import { type IVisitor, type TSubscriptionModel } from './ISubscription';

export type TPreviewRoom = {
	rid: string;
	t: RoomType;
	name?: string;
	fname?: string;
	prid?: string;
	uids?: string[];
	usernames?: string[];
	visitor?: IVisitor;
	joinCodeRequired?: boolean;
	lastMessage?: ILastMessage;
	sysMes?: boolean;
	onHold?: boolean;
};

export type TRoomOrPreview = TSubscriptionModel | TPreviewRoom;

export const isSubscriptionModel = (room: TRoomOrPreview): room is TSubscriptionModel => 'id' in room;

export const isPreviewRoom = (room: TRoomOrPreview): room is TPreviewRoom => !('id' in room);
