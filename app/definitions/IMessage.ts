import Model from '@nozbe/watermelondb/Model';
import { MarkdownAST } from '@rocket.chat/message-parser';

import { IAttachment } from './IAttachment';
import { IReaction } from './IReactions';
import { RoomType } from './IRoom';

interface IUserMessage {
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

export type TOnLinkPress = (link: string) => void;

export interface ITranslations {
	_id: string;
	language: string;
	value: string;
}

export interface IMessage {
	msg: string;
	t?: RoomType;
	ts: Date;
	u: IUserMessage;
	subscription: { id: string };
	alias: string;
	parseUrls: boolean;
	groupable: boolean;
	avatar: string;
	emoji: string;
	attachments: IAttachment[];
	urls: string[];
	_updatedAt: Date;
	status: number;
	pinned: boolean;
	starred: boolean;
	editedBy?: { _id: string; username: string };
	reactions: IReaction[];
	role: string;
	drid: string;
	dcount: number;
	dlm: Date;
	tmid: string;
	tcount: number;
	tlm: Date;
	replies: string[];
	mentions: IUserMention[];
	channels: IUserChannel[];
	unread: boolean;
	autoTranslate: boolean;
	translations: ITranslations[];
	tmsg: string;
	blocks: any;
	e2e: string;
	tshow: boolean;
	md: MarkdownAST;
}

export type TMessageModel = IMessage & Model;
