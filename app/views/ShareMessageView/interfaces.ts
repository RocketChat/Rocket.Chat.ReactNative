export interface IShareMessageViewSelectRoom {
	server: string;
	token: string;
	userId: string;
	onRoomSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
}

export interface IShareMessageViewSearchResult {
	value: string;
	text: { text: string };
	imageUrl: string;
}
