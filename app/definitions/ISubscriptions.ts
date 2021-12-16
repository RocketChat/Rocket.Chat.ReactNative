import Model from '@nozbe/watermelondb/Model';

export interface ISubscriptions {
	_id: string;
	name: string;
	fname: string;
	rid: string;
	unread: number;
	tunread: string;
	tunreadUser: string;
	tunreadGroup: string;
}

export type TSubscriptionsModel = ISubscriptions & Model;
