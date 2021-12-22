export enum SubscriptionType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread'
}

export interface IUserMessage {
	_id: string;
	username: string;
	name: string;
}

// export interface ILastMessage {"_id":string,"rid":string,"tshow":boolean,"tmid":string,"msg":string,"ts":Date,"u":IUserMessage,"_updatedAt":Date,"urls":string[],"mentions":[],"channels":[],"md":[{"type":"PARAGRAPH","value":[{"type":"PLAIN_TEXT","value":"olaaa"}]}],"attachments":[],"reactions":[],"unread":false,"status":0}

export interface ISubscription {
	_id: string; // _id belongs watermelonDB
	id: string; // id from server
	f: boolean;
	t: SubscriptionType;
	ts: Date;
	ls: Date;
	name: string;
	fname?: string;
	rid: string; // the same as id
	open: boolean;
	alert: boolean;
	roles: string[];
	unread: number;
	userMentions: number;
	groupMentions: number;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	roomUpdatedAt: Date;
	ro: boolean;
	lastOpen: Date;
	description?: string;
	announcement?: string;
	bannerClosed?: boolean;
	topic?: string;
	blocked: boolean;
	blocker: boolean;
	reactWhenReadOnly: boolean;
	archived: boolean;
	joinCodeRequired: boolean;
	notifications: any;
	muted: string[];
	ignored: string[];
	broadcast?: boolean;
	prid: string;
	draftMessage: string;
	lastThreadSync: Date;
	jitsiTimeout: number;
	autoTranslate?: boolean;
	autoTranslateLanguage?: boolean;
	// lastMessage:
	// messages
	// threads
	// threadMessages
	// hideUnreadStatus
	// sysMes
	// uids
	// usernames
	// visitor
	// departmentId
	// servedBy
	// livechatData
	// tags
	// E2EKey
	// encrypted
	// e2eKeyId
	// avatarETag
	// teamId
	// teamMain
}
// updatedAt: Date;
// rid: string;
// t: SubscriptionType;
// name: string;
// fname: string;
// prid?: string;
// tmid?: string;
// topic?: string;
// teamMain?: boolean;
// teamId?: string;
// encrypted?: boolean;
// visitor?: boolean;
// autoTranslateLanguage?: boolean;
// autoTranslate?: boolean;
// observe?: Function;
// usedCannedResponse: string;
