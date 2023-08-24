import Model from '@nozbe/watermelondb/Model';

import { IEnterpriseModules } from '../reducers/enterpriseModules';

type Dictionary = {
	[lng: string]: Record<string, string>;
};

type Messages = {
	remainingDays: number;
	message: 'message_token';
	type: 'info' | 'alert' | 'error';
	params?: Record<string, unknown>;
};

type Version = {
	version: string;
	expiration: string; // Date;
	messages?: Messages[];
};

// TODO: export used on mock only. Remove before merge.
export interface ISupportedVersions {
	timestamp: string;
	messages?: Messages[];
	versions: Version[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: Messages[];
		versions: Version[];
	};
	i18n?: Dictionary;
}

export interface IServerInfo {
	version: string;
	success: boolean;
	supportedVersions?: ISupportedVersions; // SerializedJWT<ISupportedVersions>;
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export interface ICloudInfo {
	signed: ISupportedVersions; // SerializedJWT<SupportedVersions>
	timestamp: string;
	messages?: Messages[];
	versions: Version[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: Messages[];
		versions: Version[];
	};
}

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
	supportedVersions: ISupportedVersions;
}

export type TServerModel = IServer & Model;
