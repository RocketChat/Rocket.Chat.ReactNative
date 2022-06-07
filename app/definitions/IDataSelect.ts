import { TSubscriptionModel } from './ISubscription';

export type TDataSelect = Pick<TSubscriptionModel, 'rid'> &
	Partial<Pick<TSubscriptionModel, 't' | 'name' | 'teamMain' | 'alert'>>;
