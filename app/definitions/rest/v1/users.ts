import type { ITeam } from '../../ITeam';
import type { IUser } from '../../IUser';
import { INotificationPreferences, IUserPreferences, IUserRegistered } from '../../IUser';

export type UsersEndpoints = {
	'users.2fa.sendEmailCode': {
		POST: (params: { emailOrUsername: string }) => void;
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
	'users.listTeams': {
		GET: (params: { userId: IUser['_id'] }) => { teams: Array<ITeam> };
	};
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
