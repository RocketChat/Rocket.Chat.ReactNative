import type { Model } from '../lib/database/facade';

export interface IServerHistory {
	id: string;
	url: string;
	username: string;
	updatedAt: Date;
	iconURL?: string;
}

export type TServerHistoryModel = IServerHistory & Model;
