import Model from '@nozbe/watermelondb/Model';

import { IRocketChatRecord } from './IRocketChatRecord';
import { IThreadModel } from './IThread';

export enum RoomType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread'
}

export interface IRoom extends IRocketChatRecord {
	rid: string;
	t: RoomType;
	name: string;
	fname: string;
	prid?: string;
	tmid?: string;
	topic?: string;
	teamMain?: boolean;
	teamId?: string;
	encrypted?: boolean;
	visitor?: boolean;
	autoTranslateLanguage?: boolean;
	autoTranslate?: boolean;
	observe?: Function;
	usedCannedResponse: string;
	lastThreadSync?: Date;
	tunread?: string[];
}

interface IRoomAssociation {
	threads: { fetch(): IThreadModel[] };
}

export type IRoomModel = IRoom & Model & IRoomAssociation;
