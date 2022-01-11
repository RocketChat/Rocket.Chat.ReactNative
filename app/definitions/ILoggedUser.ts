import Model from '@nozbe/watermelondb/Model';

export interface ILoggedUser {
	id: string;
	token: string;
	username: string;
	name: string;
	language?: string;
	status: string;
	statusText?: string;
	roles: string[];
	avatarETag?: string;
	showMessageInMainThread: boolean;
	isFromWebView: boolean;
	enableMessageParserEarlyAdoption?: boolean;
}

export type TLoggedUser = ILoggedUser & Model;
