import type { IUser } from '@rocket.chat/core-typings';
import type { UsersEndpoints as RestTypingsUsersEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';
import type { IProfileParams } from '../../IProfile';

export type IUsersPresenceUser = { _id: string; status?: string; statusText?: string } & Record<string, unknown>;

type BaseUsersEndpoints = AdaptEndpoints<RestTypingsUsersEndpoints>;

export type UsersEndpoints = Omit<BaseUsersEndpoints, 'users.updateOwnBasicInfo'> & {
	'users.presence': {
		GET: (params?: { ids?: string }) => { success: boolean; users: IUsersPresenceUser[] };
	};
	'users.updateOwnBasicInfo': {
		POST: (params: {
			data: IProfileParams | Pick<IProfileParams, 'username' | 'name'>;
			customFields?: { [key: string | number]: string };
		}) => { user: IUser };
	};
};
