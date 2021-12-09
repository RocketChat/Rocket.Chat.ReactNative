export interface IVisitorEmail {
	address: string;
}

export interface IVisitorPhone {
	phoneNumber: string;
}

export interface IVisitor {
	_id?: string;
	token: string;
	username: string;
	updatedAt?: Date;
	name: string;
	department?: string;
	phone?: IVisitorPhone[];
	visitorEmails?: IVisitorEmail[];
	customFields?: {
		[key: string]: any;
	};
	livechatData: {
		[key: string]: any;
	};
}
