import { Observable } from 'rxjs';
import Model from '@nozbe/watermelondb/Model';

import { IRocketChatRecord } from './IRocketChatRecord';

export enum RoomType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread',
	E2E_MESSAGE_TYPE = 'e2e'
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
	observe?(): Observable<Model>;
	usedCannedResponse?: string;
	bannerClosed?: boolean;
	lastOpen?: Date;
}
