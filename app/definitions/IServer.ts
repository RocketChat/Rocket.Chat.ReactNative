import Model from '@nozbe/watermelondb/Model';

export interface IServer {
	name: string;
	iconURL: string;
	useRealName: boolean;
	FileUpload_MediaTypeWhiteList: string;
	FileUpload_MaxFileSize: number;
	roomsUpdatedAt: Date;
	version: string;
	lastLocalAuthenticatedSession: Date;
	autoLock: boolean;
	autoLockTime?: number;
	biometry?: boolean;
	uniqueID: string;
	enterpriseModules: string;
	E2E_Enable: boolean;
}

export type TServerModel = IServer & Model;
