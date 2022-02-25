import type { IMessage } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

export type ImEndpoints = {
	'im.create': {
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
			room: IServerRoom;
		};
	};
	'im.files': {
		GET: (params: { roomId: IServerRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'im.members': {
		GET: (params: { roomId: IServerRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
