import Model from '@nozbe/watermelondb/Model';

import { TUserStatus } from './TUserStatus';
import { IRocketChatRecord } from './IRocketChatRecord';
import { ILoggedUser } from './ILoggedUser';

export interface ILoginToken {
	hashedToken: string;
	twoFactorAuthorizedUntil?: Date;
	twoFactorAuthorizedHash?: string;
}

export interface IMeteorLoginToken extends ILoginToken {
	when: Date;
}

export interface IPersonalAccessToken extends ILoginToken {
	type: 'personalAccessToken';
	createdAt: Date;
	lastTokenPart: string;
	name?: string;
	bypassTwoFactor?: boolean;
}

export interface IUserRegistered {
	_id: string;
	type: string;
	status: TUserStatus;
	active: boolean;
	name: string;
	username: string;
	__rooms: string[];
}

export interface IUserEmailVerificationToken {
	token: string;
	address: string;
	when: Date;
}

export interface IUserEmailCode {
	code: string;
	expire: Date;
}

type LoginToken = IMeteorLoginToken & IPersonalAccessToken;
export type Username = string;

export type ILoginUsername =
	| {
			username: string;
	  }
	| {
			email: string;
	  };
export type LoginUsername = string | ILoginUsername;

export interface IUserServices {
	password?: {
		bcrypt: string;
	};
	passwordHistory?: string[];
	email?: {
		verificationTokens?: IUserEmailVerificationToken[];
	};
	resume?: {
		loginTokens?: LoginToken[];
	};
	google?: any;
	facebook?: any;
	github?: any;
	totp?: {
		enabled: boolean;
		hashedBackup: string[];
		secret: string;
	};
	email2fa?: {
		enabled: boolean;
		changedAt: Date;
	};
	emailCode: IUserEmailCode[];
	saml?: {
		inResponseTo?: string;
		provider?: string;
		idp?: string;
		idpSession?: string;
		nameID?: string;
	};
	ldap?: {
		id: string;
		idAttribute?: string;
	};
}

export interface IUserEmail {
	address: string;
	verified: boolean;
}

export interface IUserSettings {
	profile: any;
	preferences: {
		[key: string]: any;
	};
}
export type TNotifications = 'default' | 'all' | 'mentions' | 'nothing';

export interface INotificationPreferences {
	id: string;
	enableMessageParserEarlyAdoption: boolean;
	desktopNotifications: TNotifications;
	pushNotifications: TNotifications;
	emailNotificationMode: 'mentions' | 'nothing';
	language?: string;
}

export interface IUserPreferences {
	user: Pick<IUser, '_id'>;
	settings: {
		preferences: INotificationPreferences;
	};
}

export interface IUser extends IRocketChatRecord, ILoggedUser {
	_id: string;
	createdAt?: Date;
	type?: string;
	active?: boolean;
	services?: IUserServices;
	statusConnection?: string;
	lastLogin?: Date;
	avatarOrigin?: string;
	utcOffset?: number;
	statusDefault?: TUserStatus;
	oauth?: {
		authorizedClients: string[];
	};
	statusLivechat?: string;
	e2e?: {
		private_key: string;
		public_key: string;
	};
	requirePasswordChange?: boolean;
	settings?: IUserSettings;
	defaultRoom?: string;
	ldap?: boolean;
	muted?: boolean;
}

export interface IRegisterUser extends IUser {
	username: string;
	name: string;
}
export const isRegisterUser = (user: IUser): user is IRegisterUser => user.username !== undefined && user.name !== undefined;

export type IUserDataEvent = {
	id: unknown;
} & (
	| ({
			type: 'inserted';
	  } & IUser)
	| {
			type: 'removed';
	  }
	| {
			type: 'updated';
			diff: Partial<IUser>;
			unset: Record<keyof IUser, boolean | 0 | 1>;
	  }
);

export type TUserModel = IUser & Model;
