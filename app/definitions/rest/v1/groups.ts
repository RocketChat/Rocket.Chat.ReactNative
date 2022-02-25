import type { IMessage } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: { roomId: IServerRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
		GET: (params: { roomId: IServerRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
