import { ILastMessage } from './IMessage';

export interface ISearchLocal {
	avatarETag: string;
	rid: string;
	name: string;
	t: string;
	fname: string;
	encrypted: boolean;
	lastMessage?: ILastMessage;
}

export interface ISearch extends ISearchLocal {
	// return only from api search
	_id: string;
	status?: string;
	username: string;
	outside?: boolean;
	search?: boolean;
}
