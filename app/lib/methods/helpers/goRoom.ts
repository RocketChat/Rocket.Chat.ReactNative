import { CommonActions } from '@react-navigation/native';

import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import Navigation from '../../navigation/appNavigation';
import {
	type IOmnichannelRoom,
	SubscriptionType,
	type IVisitor,
	type TSubscriptionModel,
	type ISubscription
} from '../../../definitions';
import { getRoomTitle, getUidDirectMessage } from './helpers';
import { createDirectMessage } from '../../services/restApi';
import { emitErrorCreateDirectMessage } from './emitErrorCreateDirectMessage';
import { getRoom } from '../getRoom';
import { emitter } from './emitter';
import UserPreferences from '../userPreferences';
import { CURRENT_SERVER } from '../../constants/keys';

interface IGoRoomItem {
	search?: boolean; // comes from spotlight
	username?: string;
	t?: SubscriptionType;
	rid?: string;
	name?: string;
	prid?: string;
	visitor?: IVisitor;
}

export type TGoRoomItem = IGoRoomItem | TSubscriptionModel | ISubscription | IOmnichannelRoomVisitor;

const navigate = ({ item, isMasterDetail, ...props }: { item: TGoRoomItem; isMasterDetail: boolean }) => {
	const routeParams = {
		rid: item.rid,
		name: getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		visitor: item.visitor,
		roomUserId: getUidDirectMessage(item),
		...props
	};

	const currentRoute = Navigation.getCurrentRoute() as any;
	if (currentRoute?.name === 'RoomView' && currentRoute?.params?.rid === item.rid) {
		Navigation.setParams(routeParams);
		return;
	}

	Navigation.popTo('DrawerNavigator');
	if (isMasterDetail) {
		return Navigation.dispatch((state: any) => {
			const routesRoomView = state.routes.filter((r: any) => r.name !== 'RoomView');
			return CommonActions.reset({
				...state,
				routes: [
					...routesRoomView,
					{
						name: 'RoomView',
						params: routeParams
					}
				],
				index: routesRoomView.length
			});
		});
	}

	return Navigation.dispatch((state: any) => {
		const routesRoomsListView = state.routes.filter((r: any) => r.name === 'RoomsListView');
		return CommonActions.reset({
			...state,
			routes: [
				...routesRoomsListView,
				{
					name: 'RoomView',
					params: routeParams
				}
			],
			index: routesRoomsListView.length
		});
	});
};

interface IOmnichannelRoomVisitor extends IOmnichannelRoom {
	// this visitor came from ee/omnichannel/views/QueueListView
	visitor: IVisitor;
}

export const goRoom = async ({
	item,
	isMasterDetail = false,
	...props
}: {
	item: TGoRoomItem;
	isMasterDetail: boolean;
	jumpToMessageId?: string;
	usedCannedResponse?: string;
}): Promise<void> => {
	const server = UserPreferences.getString(CURRENT_SERVER);
	if (!('id' in item) && item.t === SubscriptionType.DIRECT && item?.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await createDirectMessage(username as string);
			if (result.success && result?.room?._id) {
				try {
					// storing last visited room
					const room = await getRoom(result?.room?.rid || '');

					/**
					 * store.dispatch causing dependency cycle error here
					 * using emitter based flow to prevent it
					 */
					emitter.emit('roomVisited', {
						rid: result.room._id,
						name: room.prid ? room.fname || '' : room.name,
						server: server ?? ''
					});
				} catch {
					// do nothing
				}

				return navigate({
					item: {
						rid: result.room._id,
						name: username || '',
						t: SubscriptionType.DIRECT
					},
					isMasterDetail,
					...props
				});
			}
		} catch (e: any) {
			emitErrorCreateDirectMessage(e?.data);
		}
	}

	/**
	 * Fetches subscription from database to use goRoom with a more complete room object.
	 * We might want to review this logic in the future, since react-navigation complains about non-serializable data
	 * https://reactnavigation.org/docs/troubleshooting/#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state
	 */
	let _item = item;
	if (item.rid) {
		try {
			const room = await getRoom(item.rid);

			// storing last visited room
			emitter.emit('roomVisited', {
				rid: room.rid,
				name: room.prid ? room.fname || '' : room.name,
				server: server ?? ''
			});
		} catch {
			// do nothing
		}

		const sub = await getSubscriptionByRoomId(item.rid);
		if (sub) {
			_item = sub;
		}
	}

	return navigate({ item: _item, isMasterDetail, ...props });
};

export const navigateToRoom = navigate;
