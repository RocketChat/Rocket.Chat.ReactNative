export interface IForwardMessageViewSelectRoom {
	server: string;
	token: string;
	userId: string;
	onRoomSelect: ({ value }: { value: string[] }) => void;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
}

export interface IForwardMessageViewSearchResult {
	value: string;
	text: { text: string };
	imageUrl: string;
}
