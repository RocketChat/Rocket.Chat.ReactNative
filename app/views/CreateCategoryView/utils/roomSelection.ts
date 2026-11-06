import { type ICategoryRoom } from '../types';

export const isRoomIn = (rooms: ICategoryRoom[], rid: string) => rooms.some(room => room.rid === rid);

export const toggleRoomIn = (rooms: ICategoryRoom[], room: ICategoryRoom) =>
	isRoomIn(rooms, room.rid) ? rooms.filter(selected => selected.rid !== room.rid) : [...rooms, room];
