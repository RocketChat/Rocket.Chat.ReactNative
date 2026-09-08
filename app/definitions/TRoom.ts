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
	status?: string;
	lastMessage?: ILastMessage;
	sysMes?: boolean;
	onHold?: boolean;
};

export type TRoomOrPreview = TSubscriptionModel | TPreviewRoom;
export type TRoomUpdate = keyof TSubscriptionModel;
export type TRoomUpdatePatch = Partial<Pick<TSubscriptionModel, TRoomUpdate>>;
