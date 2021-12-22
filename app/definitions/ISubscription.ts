import Collection from '@nozbe/watermelondb/Collection';
import Model from '@nozbe/watermelondb/Model';

import { ILastMessage, TMessageModel } from './IMessage';
import { IServedBy } from './IServedBy';
import { TThreadModel } from './IThread';

export enum SubscriptionType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread'
}

export interface IVisitor {
	_id: string;
	username: string;
	token: string;
	status: string;
	lastMessageTs: Date;
}

export interface ISubscription {
	_id: string; // _id belongs watermelonDB
	id: string; // id from server
	f: boolean;
	t: SubscriptionType;
	ts: Date;
	ls: Date;
	name: string;
	fname?: string;
	rid: string; // the same as id
	open: boolean;
	alert: boolean;
	roles: string[];
	unread: number;
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	roomUpdatedAt: Date;
	ro: boolean;
	lastOpen: Date;
	description?: string;
	announcement?: string;
	bannerClosed?: boolean;
	topic?: string;
	blocked: boolean;
	blocker: boolean;
	reactWhenReadOnly: boolean;
	archived: boolean;
	joinCodeRequired: boolean;
	notifications: any;
	muted: string[];
	ignored: string[];
	broadcast?: boolean;
	prid: string;
	draftMessage: string;
	lastThreadSync: Date;
	jitsiTimeout: number;
	autoTranslate?: boolean;
	autoTranslateLanguage?: boolean;
	lastMessage: ILastMessage;
	hideUnreadStatus: boolean;
	sysMes?: string[] | boolean;
	uids?: string[];
	usernames?: string[];
	visitor?: IVisitor;
	departmentId?: string;
	servedBy?: IServedBy;
	livechatData?: any;
	tags?: string[];
	E2EKey?: string;
	encrypted?: boolean;
	e2eKeyId?: string;
	avatarETag?: string;
	teamId?: string;
	teamMain?: boolean;
	messages: Collection<TMessageModel>;
	threads: Collection<TThreadModel>;
	// threadMessages: Collection<TThreadMessagesModel>
	// uploads: Collection<TUploadsModel>
}

export type TSubscriptionModel = ISubscription & Model;
