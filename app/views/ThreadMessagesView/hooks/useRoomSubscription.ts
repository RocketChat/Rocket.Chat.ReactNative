import { useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { type TSubscriptionModel } from '~/definitions';
import database from '~/lib/database';
import { useObservable } from '~/lib/hooks/useObservable';

export interface IThreadUnreads {
	tunread?: string[];
	tunreadUser?: string[];
	tunreadGroup?: string[];
}

interface IRoomSubscription {
	subscription: TSubscriptionModel | null;
	unreads: IThreadUnreads;
}

const observeRoomSubscription = (rid: string) =>
	database.active
		.get('subscriptions')
		.query(Q.where('id', rid))
		.observe()
		.pipe(
			switchMap(([subscription]) => (subscription ? subscription.observe() : of(null))),
			map(
				(subscription): IRoomSubscription => ({
					subscription,
					unreads: {
						tunread: subscription?.tunread,
						tunreadUser: subscription?.tunreadUser,
						tunreadGroup: subscription?.tunreadGroup
					}
				})
			)
		);

export const useRoomSubscription = (rid: string) => {
	const roomSubscription = useObservable(useMemo(() => observeRoomSubscription(rid), [rid]));
	return {
		subscription: roomSubscription?.subscription ?? null,
		unreads: roomSubscription?.unreads ?? {}
	};
};
