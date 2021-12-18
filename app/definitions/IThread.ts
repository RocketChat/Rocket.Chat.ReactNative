import Model from '@nozbe/watermelondb/Model';

import { IAttachment } from './IAttachment';
import { IMention } from './IMention';
import { IReaction } from './IReaction';
import { RoomType } from './IRoom';
import { IUrl } from './IUrl';

export interface IThread {
	id: string;
	msg: string;
	t: RoomType;
	rid: string;
	_updated_at: Date;
	ts: Date;
	u: { _id: string; username: string; name: string };
	alias: any;
	parse_urls: any;
	groupable: boolean;
	avatar: string;
	emoji: any;
	attachments: IAttachment[];
	urls: IUrl[];
	status: number;
	pinned: boolean;
	starred: boolean;
	edited_by: { username: string };
	reactions: IReaction[];
	role: string;
	drid: string;
	dcount: number;
	dlm: number;
	tmid: string;
	tcount: 2;
	tlm: Date;
	replies: string[];
	mentions: IMention[];
	channels: [];
	unread: boolean;
	auto_translate: boolean;
	translations: any;
	e2e: any;
}

export type TThreadModel = IThread & Model;
