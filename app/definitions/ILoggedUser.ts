import Model from '@nozbe/watermelondb/Model';

import { IUserEmail, IUserSettings } from './IUser';
import { UserStatus } from './UserStatus';

export interface ILoggedUser {
	id: string;
	token: string;
	username: string;
	name: string;
	language?: string;
	status: UserStatus;
	statusText?: string;
	customFields?: {
		[key: string]: any;
	};
	statusLivechat?: string;
	emails?: IUserEmail[];
	roles?: string[];
	avatarETag?: string;
	showMessageInMainThread?: boolean;
	isFromWebView?: boolean;
	enableMessageParserEarlyAdoption?: boolean;
}

export interface ILoggedUserResultFromServer
	extends Omit<ILoggedUser, 'enableMessageParserEarlyAdoption' | 'showMessageInMainThread'> {
	settings: IUserSettings;
}

export interface ILoginResultFromServer {
	status: string;
	authToken: string;
	userId: string;
	me: ILoggedUserResultFromServer;
}

export type TLoggedUserModel = ILoggedUser & Model;
