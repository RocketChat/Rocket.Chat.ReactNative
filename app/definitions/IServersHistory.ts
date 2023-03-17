import Model from '@nozbe/watermelondb/Model';

export interface IServersHistory {
	id: string;
	url: string;
	username: string;
	updatedAt: Date;
}

export type TServersHistoryModel = IServersHistory & Model;
