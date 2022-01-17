import Model from '@nozbe/watermelondb/Model';

export interface IUser {
	_id: string;
	name?: string;
	username: string;
	avatarETag?: string;
}

export type TUserModel = IUser & Model;
