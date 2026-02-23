import type Model from '@nozbe/watermelondb/Model';
import { type Root } from '@rocket.chat/message-parser';

import { type IAttachment } from './IAttachment';
import { type IMessage, type IUserChannel, type IUserMention, type IUserMessage } from './IMessage';
import { type IUrl } from './IUrl';

interface IFileThread {
	_id: string;
	name: string;
	type: string;
}

export interface IThreadResult {
	id: string;
	_id: string;
	rid: string;
	ts: string | Date;
	msg?: string;
	file?: IFileThread;
	files?: IFileThread[];
	groupable?: boolean;
	attachments?: IAttachment[];
	md?: Root;
	u: IUserMessage;
	_updatedAt: string | Date;
	urls?: IUrl[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	replies?: string[];
	tcount?: number;
	status?: number;
	tlm?: string | Date;
}

export interface IThread extends IMessage {
	tmsg?: string;
	draftMessage?: string;
}

export type TThreadModel = IThread &
	Model & {
		asPlain: () => IMessage;
	};
