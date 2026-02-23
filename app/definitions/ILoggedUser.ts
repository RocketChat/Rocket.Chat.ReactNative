import type Model from '@nozbe/watermelondb/Model';

import { type IUserEmail, type IUserSettings } from './IUser';
import { type TUserStatus } from './TUserStatus';

export interface ILoggedUser {
	id: string;
	token: string;
	username: string;
	name?: string;
	language?: string;
	status: TUserStatus;
	statusText?: string;
	customFields?: {
		[key: string]: any;
	};
	statusLivechat?: string;
	emails?: IUserEmail[];
	roles?: string[];
	avatarETag?: string;
	showMessageInMainThread?: boolean;
	enableMessageParserEarlyAdoption: boolean;
	alsoSendThreadToChannel: 'default' | 'always' | 'never';
	bio?: string;
	nickname?: string;
	requirePasswordChange?: boolean;
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
