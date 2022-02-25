import Model from '@nozbe/watermelondb/Model';

import { IAttachment } from './IAttachment';
import { IEditedBy, ITranslations, IUserChannel, IUserMention, IUserMessage, MessageType } from './IMessage';
import { IReaction } from './IReaction';
import { IUrl } from './IUrl';

export interface IThreadMessage {
	id: string;
	_id: string;
	tmsg?: string;
	msg?: string;
	t?: MessageType;
	rid: string;
	ts: string | Date;
	u: IUserMessage;
	alias?: string;
	parseUrls?: boolean;
	groupable?: boolean;
	avatar?: string;
	emoji?: string;
	attachments?: IAttachment[];
	urls?: IUrl[];
	_updatedAt?: string | Date;
	status?: number;
	pinned?: boolean;
	starred?: boolean;
	editedBy?: IEditedBy;
	reactions?: IReaction[];
	role?: string;
	drid?: string;
	dcount?: number;
	dlm?: string | Date;
	tmid?: string;
	tcount?: number;
	tlm?: string | Date;
	replies?: string[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	unread?: boolean;
	autoTranslate?: boolean;
	translations?: ITranslations[];
	e2e?: string;
	subscription?: { id: string };
}

export type TThreadMessageModel = IThreadMessage & Model;
