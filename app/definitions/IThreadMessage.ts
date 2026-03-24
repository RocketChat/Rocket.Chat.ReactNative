import type Model from '@nozbe/watermelondb/Model';

import { type IMessage } from './IMessage';

export interface IThreadMessage extends IMessage {
	tmsg?: string;
}

export type TThreadMessageModel = IThreadMessage &
	Model & {
		asPlain: () => IMessage;
	};
