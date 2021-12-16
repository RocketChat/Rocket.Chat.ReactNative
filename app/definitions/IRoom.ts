import Model from '@nozbe/watermelondb/Model';

import { IRocketChatRecord } from './IRocketChatRecord';
import { ISubscriptions } from './ISubscriptions';

export enum RoomType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread',
	E2E_MESSAGE_TYPE = 'e2e'
}

export interface IRoom extends IRocketChatRecord, ISubscriptions {
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
	usedCannedResponse?: string;
	bannerClosed: boolean;
	lastOpen?: Date;
	draftMessage?: string;
}

export type TRoomModel = IRoom & Model;
