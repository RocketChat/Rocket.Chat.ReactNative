export interface IUserMention {
	_id: string;
	username?: string;
	name?: string;
	type?: string;
}

export interface IUserChannel {
	name: string;
	_id: string;
	fname?: string;
}

export type TOnLinkPress = (link: string) => void;
