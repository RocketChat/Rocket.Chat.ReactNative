import { ISubscription } from '../../definitions';

export interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}
