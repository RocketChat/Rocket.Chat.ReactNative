import type { IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

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
