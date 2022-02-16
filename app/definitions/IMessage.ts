import Model from '@nozbe/watermelondb/Model';
import { MarkdownAST } from '@rocket.chat/message-parser';

import { IAttachment } from './IAttachment';
import { IReaction } from './IReaction';
import { SubscriptionType } from './ISubscription';

export interface IUserMessage {
	_id: string;
	username?: string;
	name?: string;
}

export interface IUserMention extends IUserMessage {
	type: string;
}

export interface IUserChannel {
	[index: number]: string | number;
	name: string;
	_id: string;
}

export interface IEditedBy {
	_id: string;
	username: string;
}

export type TOnLinkPress = (link: string) => void;

export interface ITranslations {
	_id: string;
	language: string;
	value: string;
}

export interface ILastMessage {
	_id: string;
	rid: string;
	tshow: boolean;
	tmid: string;
	msg: string;
	ts: Date;
	u: IUserMessage;
	_updatedAt: Date;
	urls: string[];
	mentions: IUserMention[];
	channels: IUserChannel[];
	md: MarkdownAST;
	attachments: IAttachment[];
	reactions: IReaction[];
	unread: boolean;
	status: boolean;
}

export interface IMessage {
	_id?: string;
	msg?: string;
	t?: SubscriptionType;
	ts: Date;
	u: IUserMessage;
	alias: string;
	parseUrls: boolean;
	groupable?: boolean;
	avatar?: string;
	emoji?: string;
	attachments?: IAttachment[];
	urls?: string[];
	_updatedAt: Date;
	status?: number;
	pinned?: boolean;
	starred?: boolean;
	editedBy?: IEditedBy;
	reactions?: IReaction[];
	role?: string;
	drid?: string;
	dcount?: number;
	dlm?: Date;
	tmid?: string;
	tcount?: number;
	tlm?: Date;
	replies?: string[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	unread?: boolean;
	autoTranslate?: boolean;
	translations?: ITranslations[];
	tmsg?: string;
	blocks?: any;
	e2e?: string;
	tshow?: boolean;
	md?: MarkdownAST;
	subscription: { id: string };
}

export type TMessageModel = IMessage & Model;
