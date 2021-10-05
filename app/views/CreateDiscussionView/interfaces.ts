export interface ICreateChannelViewProps {
	navigation: any;
	route: {
		params?: {
			channel: string;
			message: {
				msg: string;
			};
			showCloseModal: boolean;
		};
	};
	server: string;
	user: {
		id: string;
		token: string;
	};
	create: Function;
	loading: boolean;
	result: {
		rid: string;
		t: string;
		prid: string;
	};
	failure: boolean;
	error: {
		reason: string;
	};
	theme: string;
	isMasterDetail: boolean;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	encryptionEnabled: boolean;
}

export interface ICreateDiscussionViewSelectChannel {
	server: string;
	token: string;
	userId: string;
	initial: object;
	onChannelSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: string;
}

export interface ICreateDiscussionViewSelectUsers {
	server: string;
	token: string;
	userId: string;
	selected: any[];
	onUserSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: string;
}
