import Model from '@nozbe/watermelondb/Model';

import { IServedBy } from './IServedBy';
import { SubscriptionType } from './ISubscription';

export interface IRoom {
	id: string;
	rid: string;
	prid: string;
	t: SubscriptionType;
	name: string;
	teamMain: boolean;
	alert?: boolean;
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
