import Model from '@nozbe/watermelondb/Model';

import { IAttachment } from './IAttachment';
import { IMention } from './IMention';
import { IReaction } from './IReaction';
import { RoomType } from './IRoom';
import { IUrl } from './IUrl';

interface IFileThread {
	_id: string;
	name: string;
	type: string;
}
export interface IThreadResult {
	_id: string;
	rid: string;
	ts: string;
	msg: string;
	file?: IFileThread;
	files?: IFileThread[];
	groupable?: boolean;
	attachments?: IAttachment[];
	md?: any[];
	u: { _id: string; username: string; name: string };
	_updatedAt: string;
	urls: any[];
	mentions: any[];
	channels: any[];
	replies: string[];
	tcount: number;
	tlm: string;
}

export interface IThread {
	id: string;
	msg: string;
	t: RoomType;
	rid: string;
	_updatedAt: Date;
	ts: Date;
	u: { _id: string; username: string; name: string };
	alias: any;
	parseUrls: any;
	groupable: boolean;
	avatar: string;
	emoji: any;
	attachments: IAttachment[];
	urls: IUrl[];
	status: number;
	pinned: boolean;
	starred: boolean;
	editedBy: { username: string };
	reactions: IReaction[];
	role: string;
	drid: string;
	dcount: number;
	dlm: number;
	tmid: string;
	tcount: number;
	tlm: Date;
	replies: string[];
	mentions: IMention[];
	channels: [];
	unread: boolean;
	autoTranslate: boolean;
	translations: string;
	e2e: string;
}

export type IThreadModel = IThread & Model;
