import Model from '@nozbe/watermelondb/Model';

import { IMessage } from './IMessage';
import { IRocketChatRecord } from './IRocketChatRecord';
import { IServedBy } from './IServedBy';
import { SubscriptionType } from './ISubscription';
import { IUser } from './IUser';

interface IRequestTranscript {
	email: string;
	requestedAt: Date;
	requestedBy: IUser;
	subject: string;
}

export interface IRoom {
	_id?: string;
	fname?: string;
	id: string;
	rid: string;
	prid: string;
	t: SubscriptionType;
	name: string;
	teamMain: boolean;
	alert?: boolean;
	customFields: string[];
	broadcast: boolean;
	encrypted: boolean;
	ro: boolean;
	v?: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	servedBy?: IServedBy;
	departmentId?: string;
	livechatData?: any;
	tags?: string[];
	e2eKeyId?: string;
	avatarETag?: string;
	latest?: string;
	default?: true;
	featured?: true;
	muted?: string[];
	teamId?: string;
	ignored?: string;

	_updatedAt?: Date;
	archived?: boolean;
	announcement?: string;
	description?: string;
	lastMessage?: IMessage;
	topic?: string;
	reactWhenReadOnly?: boolean;
	joinCodeRequired?: boolean;
	jitsiTimeout?: Date;
	usernames?: string[];
	uids: Array<string>;
	lm?: Date;
	sysMes?: string[];
}

export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other' // catch-all source type
}
export interface IOmnichannelRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast' | ''> {
	t: SubscriptionType.OMNICHANNEL;
	v: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	email?: {
		// Data used when the room is created from an email, via email Integration.
		inbox: string;
		thread: string;
		replyTo: string;
		subject: string;
	};
	source: {
		// TODO: looks like this is not so required as the definition suggests
		// The source, or client, which created the Omnichannel room
		type: OmnichannelSourceType;
		// An optional identification of external sources, such as an App
		id?: string;
		// A human readable alias that goes with the ID, for post analytical purposes
		alias?: string;
		// A label to be shown in the room info
		label?: string;
		// The sidebar icon
		sidebarIcon?: string;
		// The default sidebar icon
		defaultIcon?: string;
	};
	transcriptRequest?: IRequestTranscript;
	servedBy?: IServedBy;
	onHold?: boolean;
	departmentId?: string;

	lastMessage?: IMessage & { token?: string };

	tags: any;
	closedAt: any;
	metrics: any;
	waitingResponse: any;
	responseBy: any;
	priorityId: any;
	livechatData: any;
	queuedAt?: Date;

	ts: Date;
	label?: string;
	crmData?: unknown;
}

export type TRoomModel = IRoom & Model;

export type RoomType = 'c' | 'd' | 'p' | 'l' | 'v';
export type RoomID = string;
export type ChannelName = string;

// https://github.com/RocketChat/Rocket.Chat/blob/43fa95aeaf5716d728bad943c6a07d1ee7172ee2/definition/IRoom.ts#L17
export interface IServerRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name?: string;
	fname: string;
	msgs: number;
	default?: true;
	broadcast?: true;
	featured?: true;
	encrypted?: boolean;
	topic?: any;

	u: Pick<IUser, '_id' | 'username' | 'name'>;
	uids: Array<string>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	jitsiTimeout?: Date;
	webRtcCallStartTime?: Date;
	servedBy?: {
		_id: string;
	};

	streamingOptions?: {
		id?: string;
		type: string;
	};

	prid?: string;
	avatarETag?: string;
	tokenpass?: {
		require: string;
		tokens: {
			token: string;
			balance: number;
		}[];
	};

	teamMain?: boolean;
	teamId?: string;
	teamDefault?: boolean;
	open?: boolean;

	autoTranslateLanguage: string;
	autoTranslate?: boolean;
	unread?: number;
	alert?: boolean;
	hideUnreadStatus?: boolean;

	sysMes?: string[];
	muted?: string[];
	unmuted?: string[];

	usernames?: string[];
	ts?: Date;

	cl?: boolean;
	ro?: boolean;
	favorite?: boolean;
	archived?: boolean;
	announcement?: string;
	description?: string;

	reactWhenReadOnly?: boolean;
	joinCodeRequired?: boolean;
	e2eKeyId?: string;
	v?: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	departmentId?: string;
	livechatData?: any;
	tags?: string[];
}
