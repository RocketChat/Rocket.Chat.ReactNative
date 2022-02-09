export interface IUserMention {
	_id: string;
	username: string;
	name?: string;
}

export interface IUserChannel {
	name: string;
	_id: string;
}

export type TOnLinkPress = (link: string) => void;
