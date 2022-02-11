import Model from '@nozbe/watermelondb/Model';

export interface IUser {
	_id: string;
	id: string;
	name?: string;
	username: string;
	avatarETag?: string;
	token: string;
}

export type TUserModel = IUser & Model;
