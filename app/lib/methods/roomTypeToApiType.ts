enum ETypes {
	Channels = 'channels',
	Im = 'im',
	Groups = 'groups'
}

export type RoomTypes = 'c' | 'd' | 'p' | 'l';

type ApiTypes<T> = T extends 'c'
	? ETypes.Channels
	: T extends 'd'
	? ETypes.Im
	: T extends 'p'
	? ETypes.Groups
	: T extends 'l'
	? ETypes.Channels
	: never;

export const types: { [K in RoomTypes]: ApiTypes<K> } = {
	c: ETypes.Channels,
	d: ETypes.Im,
	p: ETypes.Groups,
	l: ETypes.Channels
};

export const roomTypeToApiType = <T extends RoomTypes>(t: T) => types[t];
