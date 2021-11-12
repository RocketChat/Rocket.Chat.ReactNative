export interface IVisitor {
	_id?: string;
	token: string;
	username: string;
	updatedAt?: Date;
	name: string;
	department?: string;
	phone?: Array<IVisitorPhone>;
	visitorEmails?: Array<IVisitorEmail>;
	customFields?: {
		[key: string]: any;
	};
	livechatData?: {
		[key: string]: any;
	};
}

export interface IVisitorEmail {
	address: string;
}

export interface IVisitorPhone {
	phoneNumber: string;
}
