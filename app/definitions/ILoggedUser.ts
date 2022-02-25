import Model from '@nozbe/watermelondb/Model';

import { IUserEmail } from './IUser';
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
	isFromWebView: boolean;
	showMessageInMainThread: boolean;
	enableMessageParserEarlyAdoption: boolean;
}

export interface ILoginResultFromServer {
	status: string;
	authToken: string;
	userId: string;
	me: ILoggedUser;
}

export type TLoggedUserModel = ILoggedUser & Model;
