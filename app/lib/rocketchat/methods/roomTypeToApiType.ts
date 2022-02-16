const types = {
	c: 'channels',
	d: 'im',
	p: 'groups',
	l: 'channels'
};

// TODO: refactor this
export type RoomTypes = keyof typeof types;
type ApiTypes = typeof types[RoomTypes];

const roomTypeToApiType = (t: RoomTypes): ApiTypes => types[t];

export default roomTypeToApiType;
