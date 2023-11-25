export interface INotification {
	payload: {
		message: string;
		style: string;
		ejson: string;
		collapse_key: string;
		notId: string;
		msgcnt: string;
		title: string;
		from: string;
		image: string;
		soundname: string;
		action?: { identifier: 'REPLY_ACTION' | 'ACCEPT_ACTION' | 'DECLINE_ACTION' };
	};
	identifier: string;
}
