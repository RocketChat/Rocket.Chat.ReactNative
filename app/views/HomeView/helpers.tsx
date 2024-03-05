import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';

import database from '../../lib/database';
import { TSubscriptionModel } from '../../definitions';
import { goRoom } from '../../lib/methods/helpers/goRoom';

const CHAT247ROOMID = '24-7-chatroom';

let querySubscription: Subscription;

const unsubscribeQuery = () => {
	if (querySubscription && querySubscription.unsubscribe) {
		querySubscription.unsubscribe();
	}
};

export const get247Chat = async (): Promise<TSubscriptionModel | undefined> => {
	let chatRoom: TSubscriptionModel | undefined;

	unsubscribeQuery();

	const db = database.active;

	const defaultWhereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];
	defaultWhereClause.push(Q.experimentalSortBy('room_updated_at', Q.desc));

	const observable = await db
		.get('subscriptions')
		.query(...defaultWhereClause)
		.observeWithColumns(['on_hold']);

	const subscriptionPromise = new Promise<void>((resolve, reject) => {
		querySubscription = observable.subscribe(
			data => {
				chatRoom = data.find(chat => chat.name === CHAT247ROOMID);
				resolve();
			},
			error => {
				reject(error);
			}
		);
	});

	await subscriptionPromise;
	return chatRoom;
};

export const navigateTo247Chat = async (Navigation: any, isMasterDetail: boolean) => {
	if (Navigation) {
		try {
			const chatRoom = await get247Chat();
			await Navigation.navigate('ChatsStackNavigator', {
				screen: 'RoomListView'
			});
			goRoom({ item: chatRoom, isMasterDetail });
		} catch (error) {
			console.error('error', error);
		}
	}
};
