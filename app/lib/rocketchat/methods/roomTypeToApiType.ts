const types = {
	c: 'channels',
	d: 'im',
	p: 'groups',
	l: 'channels'
};

type Keys = keyof typeof types;
type Values = typeof types[Keys];

const roomTypeToApiType = (t: Keys): Values => types[t];

export default roomTypeToApiType;
