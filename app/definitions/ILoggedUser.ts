import Model from '@nozbe/watermelondb/Model';

export interface ILoggedUser {
	id: string;
	token: string;
	username: string;
	name: string;
	language?: string;
	status: string;
	statusText?: string;
	customFields: object;
	statusLivechat: string;
	emails: string[];
	roles: string[];
	avatarETag?: string;
	isFromWebView: boolean;
	settings?: {
		preferences: {
			showMessageInMainThread: boolean;
			enableMessageParserEarlyAdoption: boolean;
		};
	};
}

export interface ILoginResult {
	status: string;
	authToken: string;
	userId: string;
	me: ILoggedUser;
}

export type TLoggedUserModel = ILoggedUser & Model;
