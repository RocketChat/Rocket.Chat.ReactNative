import Model from '@nozbe/watermelondb/Model';

import { IEnterpriseModules } from '../reducers/enterpriseModules';

export type TSVStatus = 'supported' | 'expired' | 'warn';

export type TSVDictionary = {
	[lng: string]: Record<string, string>;
};

export type TSVMessage = {
	remainingDays: number;
	title?: string;
	subtitle?: string;
	description?: string;
	type: 'info' | 'alert' | 'error';
	params?: Record<string, unknown>;
	link: string;
};

export type TSVVersion = {
	version: string;
	expiration: string;
	messages?: TSVMessage[];
};

export interface ISupportedVersionsData {
	timestamp: string;
	enforcementStartDate: string;
	messages?: TSVMessage[];
	versions: TSVVersion[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: TSVMessage[];
		versions: TSVVersion[];
	};
	i18n?: TSVDictionary;
}

export interface ISupportedVersions extends ISupportedVersionsData {
	signed: string;
}

export interface IApiServerInfo {
	version: string;
	success: boolean;
	supportedVersions?: ISupportedVersions;
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export interface IServerInfo {
	version: string;
	success: boolean;
	supportedVersions?: ISupportedVersionsData | null; // no signed
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export type TCloudInfo = ISupportedVersions;

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
	supportedVersions?: ISupportedVersionsData;
	supportedVersionsWarningAt?: Date | null;
	supportedVersionsUpdatedAt?: Date | null;
}

export type TServerModel = IServer & Model;
