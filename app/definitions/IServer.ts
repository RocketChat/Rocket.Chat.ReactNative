import Model from '@nozbe/watermelondb/Model';

import { IEnterpriseModules } from '../reducers/enterpriseModules';

export type LTSStatus = 'supported' | 'expired' | 'warn';

export type LTSDictionary = {
	[lng: string]: Record<string, string>;
};

export type LTSMessage = {
	remainingDays: number;
	message: {
		title?: string;
		subtitle?: string;
		description?: string;
	};
	type: 'info' | 'alert' | 'error';
	params?: Record<string, unknown>;
	link: string;
};

export type LTSVersion = {
	version: string;
	expiration: string; // Date;
	messages?: LTSMessage[];
};

export interface ISupportedVersions {
	timestamp: string;
	messages?: LTSMessage[];
	versions: LTSVersion[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: LTSMessage[];
		versions: LTSVersion[];
	};
	i18n?: LTSDictionary;
}

export interface IServerInfo {
	version: string;
	success: boolean;
	signed?: string; // FIXME: find a good type SerializedJWT<SupportedVersions>
	supportedVersions?: ISupportedVersions; // SerializedJWT<ISupportedVersions>;
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export interface ICloudInfo {
	signed: string; // FIXME: find a good type SerializedJWT<SupportedVersions>
	timestamp: string;
	messages?: LTSMessage[];
	versions: LTSVersion[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: LTSMessage[];
		versions: LTSVersion[];
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
	supportedVersions?: ISupportedVersions;
}

export type TServerModel = IServer & Model;
