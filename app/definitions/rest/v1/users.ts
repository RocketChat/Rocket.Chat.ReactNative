import type { ITeam } from '../../ITeam';
import type { IUser } from '../../IUser';
import { INotificationPreferences } from '../../IUser';

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
	'users.getPreferences': {
		GET: (params: { userId: IUser['_id'] }) => {
			preferences: INotificationPreferences;
			success: boolean;
		};
	};
};
