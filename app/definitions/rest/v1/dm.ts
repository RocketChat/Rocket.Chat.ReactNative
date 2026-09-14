import type { IServerRoom } from '~/definitions/IRoom';
import type { IUser } from '~/definitions/IUser';

export type DmEndpoints = {
	'dm.create': {
		POST: (
			params: (
				| {
						username: Exclude<IUser['username'], undefined>;
				  }
				| {
						usernames: string;
				  }
			) & {
				excludeSelf?: boolean;
			}
		) => {
			room: IServerRoom & { rid: IServerRoom['_id'] };
		};
	};
};
