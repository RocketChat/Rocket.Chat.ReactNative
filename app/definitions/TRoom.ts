import { type ILastMessage } from './IMessage';
import { type IVisitor, type TSubscriptionModel } from './ISubscription';

export type TPreviewRoom = {
	rid: string;
	t: string;
	name?: string;
	fname?: string;
	prid?: string;
	visitor?: IVisitor;
	joinCodeRequired?: boolean;
	lastMessage?: ILastMessage;
	sysMes?: boolean;
	onHold?: boolean;
};

export type TRoomOrPreview = TSubscriptionModel | TPreviewRoom;

export const isSubscriptionModel = (room: TRoomOrPreview): room is TSubscriptionModel => 'id' in room;

export const isPreviewRoom = (room: TRoomOrPreview): room is TPreviewRoom => !('id' in room);
