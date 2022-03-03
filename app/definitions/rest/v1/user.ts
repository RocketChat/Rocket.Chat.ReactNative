import { INotificationPreferences, IUser, IUserPreferences, IUserRegistered } from '../../IUser';

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
	'users.setPreferences': {
		POST: (params: { userId: IUser['_id']; data: Partial<INotificationPreferences> }) => {
			user: IUserPreferences;
			success: boolean;
		};
	};
	'users.register': {
		POST: (params: { name: string; email: string; username: string; pass: string }) => { user: IUserRegistered };
	};
};
