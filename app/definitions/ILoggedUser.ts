import type Model from '@nozbe/watermelondb/Model';

import { type IUserEmail } from './IUser';
import { type TStatusSource } from './TStatusSource';
import { type TUserStatus } from './TUserStatus';

export interface ILoggedUser {
	id: string;
	token: string;
	username?: string;
	name?: string;
	language?: string;
	status: TUserStatus;
	statusDefault?: TUserStatus;
	statusText?: string;
	statusExpiresAt?: string;
	statusSource?: TStatusSource;
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

export type TLoggedUserModel = ILoggedUser & Model;
