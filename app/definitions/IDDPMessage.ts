export interface IDDPMessage {
	msg: string;
	fields: {
		eventName: string;
		args: any;
	};
}
