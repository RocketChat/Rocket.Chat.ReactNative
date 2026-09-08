import { type ILastMessage } from './IMessage';
import { type ISubscription, type IVisitor, type TSubscriptionModel } from './ISubscription';

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

export const roomObservedFields = [
	'f',
	'ro',
	'blocked',
	'blocker',
	'archived',
	'tunread',
	'tunreadUser',
	'tunreadGroup',
	'muted',
	'ignored',
	'jitsiTimeout',
	'announcement',
	'sysMes',
	'topic',
	'name',
	'fname',
	'roles',
	'bannerClosed',
	'visitor',
	'joinCodeRequired',
	'teamMain',
	'teamId',
	'status',
	'onHold',
	't',
	'autoTranslate',
	'autoTranslateLanguage',
	'unmuted',
	'E2EKey',
	'encrypted',
	'inviter'
] as const satisfies readonly (keyof ISubscription)[];

export type TRoomObservedField = (typeof roomObservedFields)[number];
export type TRoomObservedFields = Partial<Pick<ISubscription, TRoomObservedField>>;
