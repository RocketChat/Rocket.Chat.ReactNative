import { type RoomType } from '~/definitions/IRoom';

enum ETypes {
	Channels = 'channels',
	Im = 'im',
	Groups = 'groups'
}

type ApiTypes<T> = T extends 'c'
	? ETypes.Channels
	: T extends 'd'
		? ETypes.Im
		: T extends 'p'
			? ETypes.Groups
			: T extends 'l'
				? ETypes.Channels
				: never;

export const types: { [K in RoomType]: ApiTypes<K> } = {
	c: ETypes.Channels,
	d: ETypes.Im,
	p: ETypes.Groups,
	l: ETypes.Channels
};

export const roomTypeToApiType = <T extends RoomType>(t: T) => types[t];

export const isRoomType = (t: unknown): t is RoomType => typeof t === 'string' && t in types;
