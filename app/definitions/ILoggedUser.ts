import type Model from '@nozbe/watermelondb/Model';

import { type ISidebarCategory, type IUserEmail, type IUserSettings } from './IUser';
import { type TStatusSource } from './TStatusSource';
import { type TUserStatus } from './TUserStatus';

/** The external device (e.g. a desk phone) the user takes calls on; absent when they take them in Rocket.Chat. */
export interface IUserMediaCallDevice {
	id: string;
	appId: string;
	name?: string;
}

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
	sidebarCategories?: ISidebarCategory[];
	settings?: IUserSettings;
	mediaCallDevice?: IUserMediaCallDevice;
}

export type TLoggedUserModel = ILoggedUser & Model;
