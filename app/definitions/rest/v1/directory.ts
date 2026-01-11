import { type IServerRoom } from '../../IRoom';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

export type DirectoryEndpoint = {
	directory: {
		GET: (params: {
			query: { [key: string]: string };
			count: number;
			offset: number;
			sort: { [key: string]: number };
		}) => PaginatedResult<{ result: IServerRoom[]; count: number }>;
	};
};
