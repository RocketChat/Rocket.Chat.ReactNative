export interface IAttachment {
	filename: string;
	description?: string;
	size: number;
	mime?: string;
	path: string;
	canUpload: boolean;
	error?: any;
	uri: string;
}

export interface IUseDimensions {
	width: number;
	height: number;
}

// TODO: move this to specific folder
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
	autoLockTime: number | null;
	biometry: boolean | null;
	uniqueID: string;
	enterpriseModules: string;
	E2E_Enable: boolean;
}
