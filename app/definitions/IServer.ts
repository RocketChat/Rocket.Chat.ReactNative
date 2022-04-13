import Model from '@nozbe/watermelondb/Model';

import { IEnterpriseModules } from '../reducers/enterpriseModules';

export interface IServer {
	name: string;
	iconURL: string;
	useRealName: boolean;
	FileUpload_MediaTypeWhiteList: string;
	FileUpload_MaxFileSize: number;
	roomsUpdatedAt: Date | null;
	version: string;
	lastLocalAuthenticatedSession: Date;
	autoLock: boolean;
	autoLockTime?: number;
	biometry?: boolean;
	uniqueID: string;
	enterpriseModules: IEnterpriseModules;
	E2E_Enable: boolean;
}

export interface IServerInfo {
	id: string;
	iconURL: string;
	name: string;
	useRealName?: boolean;
}

export type TServerModel = IServer & Model;
