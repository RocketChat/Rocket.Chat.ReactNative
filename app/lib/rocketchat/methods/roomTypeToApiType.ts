enum ETypes {
	Channels = 'channels',
	Im = 'im',
	Groups = 'groups'
}

export const types = {
	c: ETypes.Channels,
	d: ETypes.Im,
	p: ETypes.Groups,
	l: ETypes.Channels
};

// TODO: refactor this
export type RoomTypes = keyof typeof types;
type ApiTypes = typeof types[RoomTypes];

const roomTypeToApiType = (t: RoomTypes): ApiTypes => types[t];

export default roomTypeToApiType;
