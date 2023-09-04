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
	expiration: string; // Date;
	messages?: TSVMessage[];
};

export interface ISupportedVersions {
	timestamp: string;
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
	messages?: TSVMessage[];
	versions: TSVVersion[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: TSVMessage[];
		versions: TSVVersion[];
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
	supportedVersionsWarningAt?: Date;
}

export type TServerModel = IServer & Model;
