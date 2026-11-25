import { type SubscriptionType } from '~/definitions/ISubscription';

export interface ICategoryRoom {
	rid: string;
	title: string;
	avatar: string;
	t: SubscriptionType;
}
