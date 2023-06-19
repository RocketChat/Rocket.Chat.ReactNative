export interface IForwardMessageViewSelectRoom {
	server: string;
	token: string;
	userId: string;
	onRoomSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
}

export interface IForwardMessageViewSearchResult {
	value: string;
	text: { text: string };
	imageUrl: string;
}
