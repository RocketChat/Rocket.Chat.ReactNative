import { type IInviteSubscription, type ISubscription } from '~/definitions/ISubscription';

export const isInviteSubscription = (subscription: ISubscription): subscription is IInviteSubscription =>
	subscription?.status === 'INVITED' && !!subscription.inviter;
