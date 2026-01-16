import { type IServerRoom } from './IRoom';
import { type IUser } from './IUser';

export type TSpotlightUser = Pick<IUser, '_id' | 'status' | 'name' | 'username'> & { outside: boolean };

export type ISpotlightRoom = Pick<IServerRoom, '_id' | 'name' | 't'> & Partial<Pick<IServerRoom, 'lastMessage'>>;

export interface ISpotlight {
	users: TSpotlightUser[];
	rooms: ISpotlightRoom[];
}
