import Model from '@nozbe/watermelondb/Model';
import { Root } from '@rocket.chat/message-parser';

import { IAttachment } from './IAttachment';
import { IMessage, IUserChannel, IUserMention, IUserMessage } from './IMessage';
import { IUrl } from './IUrl';

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
