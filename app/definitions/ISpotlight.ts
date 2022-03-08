import { IServerRoomItem } from './IRoom';
import { IUser } from './IUser';

export type TSpotlightUser = Pick<IUser, '_id' | 'status' | 'name' | 'username'> & { outside: boolean };

export type ISpotlightRoom = Pick<IServerRoomItem, '_id' | 'name' | 't'> & Partial<Pick<IServerRoomItem, 'lastMessage'>>;

export interface ISpotlight {
	users: TSpotlightUser[];
	rooms: ISpotlightRoom[];
}
