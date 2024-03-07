import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';

import database from '../../lib/database';
import { SubscriptionType, TSubscriptionModel } from '../../definitions';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { Services } from '../../lib/services';
import log from '../../lib/methods/helpers/log';

const CHAT247ROOMID = '24-7-chatroom';
const VIRTUAL_HAPPY_HOUR_ROOMID = 'virtual-happy-hours';
const TECH_SUPPORT_USERNAME = 'tech_support';

export const getVirtualHappyHourChat = async (): Promise<TSubscriptionModel | undefined> => {
  unsubscribeQuery();

  const db = database.active;
  const defaultWhereClause = [
    Q.where('archived', false),
    Q.where('open', true),
    Q.experimentalSortBy('room_updated_at', Q.desc),
  ] as (Q.WhereDescription | Q.SortBy)[];

  return new Promise<TSubscriptionModel | undefined>((resolve, reject) => {
    const observable = db
      .get('subscriptions')
      .query(...defaultWhereClause)
      .observeWithColumns(['on_hold']);

    const subscription = observable.subscribe({
      next: data => {
        const chatRoom = data.find(chat => chat.name === VIRTUAL_HAPPY_HOUR_ROOMID);
        resolve(chatRoom);
      },
      error: reject,
    });
  });
};

export const navigateToVirtualHappyHour = async (Navigation: any, isMasterDetail: boolean) => {
   if (Navigation) {
       try {
           const chatRoom = await getVirtualHappyHourChat();
           await Navigation.navigate('ChatsStackNavigator', {
               screen: 'RoomsListView'
           });
           goRoom({ item: chatRoom, isMasterDetail });
       } catch (error) {
           console.error('error', error);
       }
   }
};

 export const navToTechSupport= async (Navigation: any, isMasterDetail: boolean): Promise<void> => {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const query = await subsCollection.query(Q.where('name', TECH_SUPPORT_USERNAME)).fetch();
		if (query.length > 0) {
			const room = query[0]
			await Navigation.navigate('ChatsStackNavigator', {
				screen: 'RoomsListView'
			});
			handleGoRoom(room, isMasterDetail);
		} else {
			const result = await Services.createDirectMessage(TECH_SUPPORT_USERNAME);
			if (result.success) {
				await Navigation.navigate('ChatsStackNavigator', {
					screen: 'RoomsListView'
				});
				handleGoRoom({ rid: result.room?._id as string, name: TECH_SUPPORT_USERNAME, t: SubscriptionType.DIRECT }, isMasterDetail);
			}
		}
	} catch (e) {
		log(e);
	}
};

const handleGoRoom = (item: TGoRoomItem, isMasterDetail: boolean): void => {
	goRoom({ item, isMasterDetail, popToRoot: true });
};


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
				screen: 'RoomsListView'
			});
			goRoom({ item: chatRoom, isMasterDetail });
		} catch (error) {
			console.error('error', error);
		}
	}
};
