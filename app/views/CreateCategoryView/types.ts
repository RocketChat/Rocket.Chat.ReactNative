import { type SubscriptionType } from '~/definitions';

export interface ICategoryRoom {
	rid: string;
	title: string;
	avatar: string;
	t: SubscriptionType;
}
