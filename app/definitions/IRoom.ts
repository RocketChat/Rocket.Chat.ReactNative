import Model from '@nozbe/watermelondb/Model';

import { IServedBy } from './IServedBy';

export interface IRoom {
	id: string;
	customFields: string[];
	broadcast: boolean;
	encrypted: boolean;
	ro: boolean;
	v?: string[];
	servedBy?: IServedBy;
	departmentId?: string;
	livechatData?: any;
	tags?: string[];
	e2eKeyId?: string;
	avatarETag?: string;
}

export type TRoomModel = IRoom & Model;
