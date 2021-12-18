import Model from '@nozbe/watermelondb/Model';

import { ISubscriptions } from './ISubscriptions';

export interface IMessage extends ISubscriptions {
	id: string;
	rid: string;
	ts: number;
	u: string;
	alias: string;
	parse_urls: string;
	_updated_at: number;
	msg?: string;
	t?: string;
	groupable?: boolean;
	avatar?: string;
	emoji?: string;
	attachments?: string;
	urls?: string;
	status?: number;
	pinned?: boolean;
	starred?: boolean;
	edited_by?: string;
	reactions?: string;
	role?: string;
	drid?: string;
	dcount?: number;
	dlm?: number;
	tmid?: string;
	tcount?: number;
	tlm?: number;
	replies?: string;
	mentions?: string;
	channels?: string;
	auto_translate?: boolean;
	translations?: string;
	tmsg?: string;
	blocks?: string;
	e2e?: string;
	tshow?: boolean;
	md?: string;
}

export type TMessageModel = IMessage & Model;
