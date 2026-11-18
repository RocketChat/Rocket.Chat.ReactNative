import { type RoomType } from '~/definitions/IRoom';

export interface ICategoryRoom {
	rid: string;
	title: string;
	avatar: string;
	t: RoomType;
}
