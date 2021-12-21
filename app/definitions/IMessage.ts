export interface IMessage {
	id: any;
	ts: Date;
	msg: string;
	u: {
		username?: string;
		name?: string;
	};
}
