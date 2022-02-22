import Model from '@nozbe/watermelondb/Model';
import Relation from '@nozbe/watermelondb/Relation';

import { ILastMessage, TMessageModel } from './IMessage';
import { IServedBy } from './IServedBy';
import { TThreadModel } from './IThread';
import { TThreadMessageModel } from './IThreadMessage';
import { TUploadModel } from './IUpload';

export enum SubscriptionType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	E2E = 'e2e',
	THREAD = 'thread' // FIXME: this is not a type of subscription
}

export interface IVisitor {
	_id: string;
	username: string;
	token: string;
	status: string;
	lastMessageTs: Date;
}

export enum ERoomTypes {
	DIRECT = 'direct',
	GROUP = 'group',
	CHANNEL = 'channel'
}

export interface ISubscription {
	_id: string; // _id belongs watermelonDB
	id: string; // id from server
	_updatedAt?: string; // from server
	v?: IVisitor;
	f: boolean;
	t: SubscriptionType;
	ts: string | Date;
	ls: Date;
	name: string;
	fname?: string;
	rid: string; // the same as id
	open: boolean;
	alert: boolean;
	roles?: string[];
	unread: number;
	lm: string;
	lr: string;
	userMentions: number;
	groupMentions: number;
	tunread?: string[];
	tunreadUser?: string[];
	tunreadGroup?: string[];
	roomUpdatedAt: Date | number;
	ro: boolean;
	lastOpen?: Date;
	description?: string;
	announcement?: string;
	bannerClosed?: boolean;
	topic?: string;
	blocked?: boolean;
	blocker?: boolean;
	reactWhenReadOnly?: boolean;
	archived: boolean;
	joinCodeRequired?: boolean;
	muted?: string[];
	ignored?: string[];
	broadcast?: boolean;
	prid?: string;
	draftMessage?: string | null;
	lastThreadSync?: Date;
	jitsiTimeout?: number;
	autoTranslate?: boolean;
	autoTranslateLanguage: string;
	lastMessage?: ILastMessage;
	hideUnreadStatus?: boolean;
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
	// https://nozbe.github.io/WatermelonDB/Relation.html#relation-api
	messages: Relation<TMessageModel>;
	threads: Relation<TThreadModel>;
	threadMessages: Relation<TThreadMessageModel>;
	uploads: Relation<TUploadModel>;
}

export type TSubscriptionModel = ISubscription & Model;

export interface IServerSubscriptionItem {
	_id: string;
	rid: string;
	u: {
		_id: string;
		username: string;
	};
	_updatedAt: string;
	alert: boolean;
	fname: string;
	groupMentions: number;
	name: string;
	open: boolean;
	t: string;
	unread: number;
	userMentions: number;
	ls: string;
	lr: string;
	tunread: number[] | [];
}

export interface IServerSubscription {
	update: IServerSubscriptionItem[];
	remove: IServerSubscriptionItem[];
	success: boolean;
}
