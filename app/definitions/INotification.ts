export interface INotification {
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
	getData: () => INotification;
}
