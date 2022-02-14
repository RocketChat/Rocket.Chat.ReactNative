export interface IReaction {
	[index: string]: string | string[];
	_id: string;
	emoji: string;
	usernames: string[];
}
