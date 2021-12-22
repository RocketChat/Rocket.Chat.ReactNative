export enum SubscriptionType {
	GROUP = 'p',
	DIRECT = 'd',
	CHANNEL = 'c',
	OMNICHANNEL = 'l',
	THREAD = 'thread'
}

export interface ISubscription {
	id: string;
	updatedAt: Date;
	rid: string;
	t: SubscriptionType;
	name: string;
	fname: string;
	prid?: string;
	tmid?: string;
	topic?: string;
	teamMain?: boolean;
	teamId?: string;
	encrypted?: boolean;
	visitor?: boolean;
	autoTranslateLanguage?: boolean;
	autoTranslate?: boolean;
	observe?: Function;
	usedCannedResponse: string;
}
