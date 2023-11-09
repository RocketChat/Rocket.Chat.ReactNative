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
	};
	identifier: string;
	action?: { identifier: 'REPLY_ACTION' | 'ACCEPT_ACTION' | 'REJECT_ACTION' };
}
