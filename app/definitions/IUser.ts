import Model from '@nozbe/watermelondb/Model';

export interface IUser {
	_id: string;
	name?: string;
	e2e?: {
		public_key: string;
	};
	username: string;
	avatarETag?: string;
}

export type TUserModel = IUser & Model;
