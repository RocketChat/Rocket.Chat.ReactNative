import { type RoomType } from '~/definitions';

export interface ICategoryRoom {
	rid: string;
	title: string;
	avatar: string;
	t: RoomType;
}
