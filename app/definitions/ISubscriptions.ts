import Model from '@nozbe/watermelondb/Model';

import { IRoom } from './IRoom';

export interface ISubscriptions {
	_id: string;
	name: string;
	fname: string;
	rid: string;
	unread: number;
}

export type ISubscriptionsModel = IRoom & Model;
