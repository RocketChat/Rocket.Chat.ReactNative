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
import { createDirectMessage } from '../createDirectMessage';
import { emitErrorCreateDirectMessage } from './emitErrorCreateDirectMessage';

interface IGoRoomItem {
	search?: boolean; // comes from spotlight
	username?: string;
	t?: SubscriptionType;
	rid?: string;
	name?: string;
	prid?: string;
	visitor?: IVisitor;
	joinCodeRequired?: boolean;
}

export type TGoRoomItem = IGoRoomItem | TSubscriptionModel | ISubscription | IOmnichannelRoomVisitor;

interface RoomRouteParams {
	rid?: string;
	name: string;
	t?: SubscriptionType;
	prid?: string;
	visitor?: IVisitor;
	joinCodeRequired?: boolean;
	roomUserId?: string;
}

const navigate = ({ item, isMasterDetail, ...props }: { item: TGoRoomItem; isMasterDetail: boolean }) => {
	const routeParams: RoomRouteParams = {
		rid: item.rid,
		name: getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		visitor: item.visitor,
		joinCodeRequired: item.joinCodeRequired,
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
	if (!('id' in item) && item.t === SubscriptionType.DIRECT && item?.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await createDirectMessage(username as string);
			if (result.success && result?.room?._id) {
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

	// Re-fetch the subscription so scalar route params (name, prid, visitor, roomUserId) are as complete as possible.
	let _item = item;
	if (item.rid) {
		const sub = await getSubscriptionByRoomId(item.rid);
		if (sub) {
			_item = sub;
		}
	}

	return navigate({ item: _item, isMasterDetail, ...props });
};

export const navigateToRoom = navigate;
