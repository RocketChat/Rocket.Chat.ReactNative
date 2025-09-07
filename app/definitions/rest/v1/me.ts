import type { IUser } from '../../IUser';

export type MeEndpoints = {
	me: {
		GET: () => IUser;
	};
};
