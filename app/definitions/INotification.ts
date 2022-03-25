export interface INotification {
	payload: {
		message: string;
		'google.message_id': string;
		style: string;
		ejson: string;
		collapse_key: string;
		'google.delivered_priority': string;
		'google.original_priority': string;
		notId: string;
		msgcnt: string;
		title: string;
		'google.sent_time': number;
		from: string;
		'google.c.sender.id': string;
		'google.ttl': number;
		image: string;
		soundname: string;
	};
	identifier: string;
}
