import { IUser, IUserRegistered } from '../../IUser';

export type UserEndpoints = {
	'users.info': {
		GET: (params: { userId: IUser['_id'] }) => {
			user: IUser;
			success: boolean;
		};
		POST: (params: { userId: IUser['_id'] }) => {
			user: IUser;
			success: boolean;
		};
	};
	'users.register': {
		POST: (params: { name: string; email: string; username: string; pass: string }) => { user: IUserRegistered };
	};
};
