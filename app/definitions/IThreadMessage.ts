import Model from '@nozbe/watermelondb/Model';

import { IAttachment } from './IAttachment';
import { IEditedBy, ITranslations, IUserChannel, IUserMention, IUserMessage } from './IMessage';
import { IReaction } from './IReaction';
import { SubscriptionType } from './ISubscription';

export interface IThreadMessage {
	msg?: string;
	t?: SubscriptionType;
	rid: string;
	ts: Date;
	u: IUserMessage;
	alias?: string;
	parseUrls?: boolean;
	groupable?: boolean;
	avatar?: string;
	emoji?: string;
	attachments?: IAttachment[];
	urls?: string[];
	_updatedAt?: Date;
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
	e2e?: string;
	subscription: { id: string };
}

export type TThreadMessageModel = IThreadMessage & Model;
