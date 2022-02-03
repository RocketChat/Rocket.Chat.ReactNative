import Model from '@nozbe/watermelondb/Model';

export interface IUser {
	id: string;
	token: string;
	name?: string;
	username?: string;
	avatarETag?: string;
}

export type TUserModel = IUser & Model;
