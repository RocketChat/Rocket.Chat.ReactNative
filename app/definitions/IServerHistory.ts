import Model from '@nozbe/watermelondb/Model';

export interface IServerHistory {
	id: string;
	url: string;
	username: string;
	updatedAt: Date;
}

export type TServerHistoryModel = IServerHistory & Model;
