import { type IUserEmail, type IUserSettings } from '../../IUser';
import { type TUserStatus } from '../../TUserStatus';

export interface ILoginMeResponse {
	_id: string;
	name: string;
	emails: IUserEmail[];
	status: TUserStatus;
	statusConnection: string;
	username: string;
	utcOffset: number;
	active: boolean;
	roles: string[];
	settings: IUserSettings;
	avatarUrl: string;
}

export interface ILoginDataResponse {
	authToken: string;
	userId: string;
	me: ILoginMeResponse;
}

export type AuthEndpoints = {
	login: {
		POST: (params: { user?: string; password?: string; resume?: string; code?: string }) => {
			status: string;
			data: ILoginDataResponse;
		};
	};
};
