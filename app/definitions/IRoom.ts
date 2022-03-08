import Model from '@nozbe/watermelondb/Model';
import { MarkdownAST } from '@rocket.chat/message-parser';

import { IAttachment } from './IAttachment';
import { IMessage } from './IMessage';
import { IServedBy } from './IServedBy';
import { IVisitor, SubscriptionType } from './ISubscription';
import { IUser } from './IUser';

interface IRequestTranscript {
	email: string;
	requestedAt: Date;
	requestedBy: IUser;
	subject: string;
}

export interface IRoom {
	_id: string;
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
	v?: IVisitor;
	status?: string;
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
}

export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other' // catch-all source type
}
export interface IOmnichannelRoom extends Partial<Omit<IRoom, 'default' | 'featured' | 'broadcast'>> {
	_id: string;
	rid: string;
	t: SubscriptionType.OMNICHANNEL;
	v: IVisitor;
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
		_updatedAt?: Date;
		queuedAt?: Date;
	};
	transcriptRequest?: IRequestTranscript;
	servedBy?: IServedBy;
	onHold?: boolean;
	departmentId?: string;

	lastMessage?: IMessage & { token?: string };

	tags?: string[];
	closedAt?: Date;
	metrics?: any;
	waitingResponse?: any;
	responseBy?: any;
	priorityId?: any;
	livechatData?: any;
	queuedAt?: Date;

	ts: Date;
	label?: string;
	crmData?: unknown;
	message?: string;
	queueOrder?: string;
	estimatedWaitingTimeQueue?: string;
	estimatedServiceTimeAt?: Date;
}

export type TRoomModel = IRoom & Model;

export interface IServerRoomItem {
	_id: string;
	name: string;
	fname: string;
	t: SubscriptionType;
	u: {
		_id: string;
		username: string;
	};
	customFields: {};
	ts: string;
	ro: boolean;
	_updatedAt: string;
	lm: string;
	lastMessage: {
		alias: string;
		msg: string;
		attachments: IAttachment[];
		parseUrls: boolean;
		bot: {
			i: string;
		};
		groupable: boolean;
		avatar: string;
		ts: string;
		u: IUser;
		rid: string;
		_id: string;
		_updatedAt: string;
		mentions: [];
		channels: [];
		md: MarkdownAST;
	};
	topic: string;
	joinCodeRequired: boolean;
	description: string;
	jitsiTimeout: string;
	usersCount: number;
	e2eKeyId: string;
	avatarETag: string;
	encrypted: boolean;
}

export interface IServerRoom {
	update: IServerRoomItem[];
	remove: IServerRoomItem[];
	success: boolean;
}
