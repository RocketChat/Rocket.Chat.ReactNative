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
	joinCodeRequired: boolean;
	alert: boolean;
	userMentions: object;
	ls: Date;
	jitsiTimeout: number;
	ignored: any;
	announcement: string;
	sysMes: string;
	archived: string;
	broadcast: string;
}

export type TSubscriptionsModel = ISubscriptions & Model;
