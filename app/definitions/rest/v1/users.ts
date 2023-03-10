import { IProfileParams } from '../../IProfile';
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
	'users.forgotPassword': {
		POST: (params: { email: string }) => {};
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
		POST: (params: { userId?: IUser['_id']; data: Partial<INotificationPreferences> }) => {
			user: IUserPreferences;
			success: boolean;
		};
	};
	'users.register': {
		POST: (params: { name: string; email: string; username: string; pass: string }) => { user: IUserRegistered };
	};
	'users.setStatus': {
		POST: (params: { status?: string; message?: string }) => {};
	};
	'users.updateOwnBasicInfo': {
		POST: (params: {
			data: IProfileParams | Pick<IProfileParams, 'username'>;
			customFields?: { [key: string | number]: string };
		}) => {
			user: IUser;
		};
	};
	'users.getUsernameSuggestion': {
		GET: () => { result: string };
	};
	'users.resetAvatar': {
		POST: (params: { userId: string }) => {};
	};
	'users.removeOtherTokens': {
		POST: (params: { userId: string }) => {};
	};
	'users.getPreferences': {
		GET: (params: { userId: IUser['_id'] }) => {
			preferences: INotificationPreferences;
			success: boolean;
		};
	};
	'users.deleteOwnAccount': {
		POST: (params: { password: string; confirmRelinquish: boolean }) => { success: boolean };
	};
};
