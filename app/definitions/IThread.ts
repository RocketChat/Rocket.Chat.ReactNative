import Model from '@nozbe/watermelondb/Model';

import { IAttachment } from './IAttachment';
import { IEditedBy, IUserChannel, IUserMention, IUserMessage, MessageType } from './IMessage';
import { IReaction } from './IReaction';
import { IUrl } from './IUrl';

export interface IThread {
	id: string;
	tmsg?: string;
	msg?: string;
	t?: MessageType;
	rid: string;
	_updatedAt?: string | Date;
	ts?: string | Date;
	u?: IUserMessage;
	alias?: string;
	parseUrls?: boolean;
	groupable?: boolean;
	avatar?: string;
	emoji?: string;
	attachments?: IAttachment[];
	urls?: IUrl[];
	status?: number;
	pinned?: boolean;
	starred?: boolean;
	editedBy?: IEditedBy;
	reactions?: IReaction[];
	role?: string;
	drid?: string;
	dcount?: number | string;
	dlm?: string | Date;
	tmid?: string;
	tcount?: number | string;
	tlm?: string | Date;
	replies?: string[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	unread?: boolean;
	autoTranslate?: boolean;
	translations?: any;
	e2e?: string;
	subscription?: { id: string };
}

export type TThreadModel = IThread & Model;
