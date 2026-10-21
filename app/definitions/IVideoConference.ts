import type { AtLeast } from './utils';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';
import type { IMessage } from './IMessage';

export declare enum VideoConferenceStatus {
	CALLING = 0,
	STARTED = 1,
	EXPIRED = 2,
	ENDED = 3,
	DECLINED = 4
}
export declare type DirectCallInstructions = {
	type: 'direct';
	calleeId: IUser['_id'];
	callId: string;
};
export declare type ConferenceInstructions = {
	type: 'videoconference';
	callId: string;
	rid: IRoom['_id'];
};
export declare type LivechatInstructions = {
	type: 'livechat';
	callId: string;
};
export declare type VideoConferenceType =
	| DirectCallInstructions['type']
	| ConferenceInstructions['type']
	| LivechatInstructions['type'];
export type VideoConferenceLeaveReason = 'reported' | 'timeout';

export interface IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'> {
	ts: Date;
	joined?: boolean;
	joinedAt?: Date;
	declined?: boolean;
	declinedAt?: Date;
	leftAt?: Date;
	leftReason?: VideoConferenceLeaveReason;
	lastSeenAt?: Date;
	ringingAt?: Date;
}
export interface IVideoConference extends IRocketChatRecord {
	type: VideoConferenceType;
	rid: string;
	discussionRid?: IRoom['_id'];
	users: IVideoConferenceUser[];
	status: VideoConferenceStatus;
	messages: {
		started?: IMessage['_id'];
		ended?: IMessage['_id'];
	};
	url?: string;
	createdBy: Pick<Required<IUser>, '_id' | 'username' | 'name'>;
	createdAt: Date;
	endedBy?: Pick<Required<IUser>, '_id' | 'username' | 'name'>;
	endedAt?: Date;
	providerName: string;
	providerData?: Record<string, any>;
	ringing?: boolean;
}
export interface IDirectVideoConference extends IVideoConference {
	type: 'direct';
}
export interface IGroupVideoConference extends IVideoConference {
	type: 'videoconference';
	anonymousUsers: number;
	title: string;
}
export interface ILivechatVideoConference extends IVideoConference {
	type: 'livechat';
}
export declare type VideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;
export declare type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions | LivechatInstructions;
export declare const isDirectVideoConference: (call: VideoConference | undefined | null) => call is IDirectVideoConference;
export declare const isGroupVideoConference: (call: VideoConference | undefined | null) => call is IGroupVideoConference;
export declare const isLivechatVideoConference: (call: VideoConference | undefined | null) => call is ILivechatVideoConference;
declare type GroupVideoConferenceCreateData = Omit<IGroupVideoConference, 'createdBy'> & {
	createdBy: IUser['_id'];
};
declare type DirectVideoConferenceCreateData = Omit<IDirectVideoConference, 'createdBy'> & {
	createdBy: IUser['_id'];
};
declare type LivechatVideoConferenceCreateData = Omit<ILivechatVideoConference, 'createdBy'> & {
	createdBy: IUser['_id'];
};
export declare type VideoConferenceCreateData = AtLeast<
	DirectVideoConferenceCreateData | GroupVideoConferenceCreateData | LivechatVideoConferenceCreateData,
	'createdBy' | 'type' | 'rid' | 'providerName' | 'providerData'
>;

export type VideoConferenceCapabilities = {
	mic?: boolean;
	cam?: boolean;
	title?: boolean;
	embedded?: boolean;
	persistentChat?: boolean;
};

export type VideoConferenceChatAccess = {
	rid: IRoom['_id'];
	name: string;
	type: IRoom['t'];
	membersWithoutAccess: IUser['_id'][];
	canInvite: boolean;
};

export type VideoConferenceChatAccessMode = 'invite' | 'discussion';

export type VideoConferenceCallConfig = {
	providerName: string;
	livekit?: { serverUrl: string; token: string; roomName: string };
};

export type VideoConfCallIdProps = { callId: string };

export type VideoConfStartProps = { roomId: string; title?: string; allowRinging?: boolean };

export type VideoConfJoinProps = {
	callId: string;
	state?: {
		mic?: boolean;
		cam?: boolean;
	};
};

export type VideoConfCancelProps = {
	callId: string;
};

export type VideoConfListProps = {
	roomId: string;
	count?: number;
	offset?: number;
};

export type VideoConfInfoProps = { callId: string };

export type VideoConfAddParticipantsProps = { callId: string; users: string[]; ring?: boolean };

export type VideoConfRingProps = { callId: string; userId: string };

export type VideoConfShareChatProps = { callId: string; mode: VideoConferenceChatAccessMode };

export type VideoConfCall = VideoConference & {
	capabilities: VideoConferenceCapabilities;
	chatAccess: VideoConferenceChatAccess;
};
