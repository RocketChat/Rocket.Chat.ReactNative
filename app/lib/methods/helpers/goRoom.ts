import { CommonActions } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

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
import type {
	getOrCreateRoomStore as TGetOrCreateRoomStore,
	releaseRoomStore as TReleaseRoomStore
} from '../../../views/RoomView/stores/RoomStore';

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
		visitor: item.visitor,
		roomUserId: getUidDirectMessage(item),
		...props
	};

	const currentRoute = Navigation.getCurrentRoute() as any;
	if (currentRoute?.name === 'RoomView' && currentRoute?.params?.rid === item.rid) {
		Navigation.setParams(routeParams);
		return;
	}

	// Warm the RoomStore at press time so its DB observer runs during the nav transition and
	// RoomView mounts against a hydrated store. The mount acquisition reuses this entry (refcount++);
	// the grace release below fires after the transition: if RoomView claimed the store it stays alive,
	// otherwise (cancelled/failed navigation) refcount returns to zero and the observer is torn down.
	if (routeParams.rid) {
		// Lazy require: goRoom is a low-level helper imported across the app, RoomStore lives in the
		// view layer and pulls the encryption/native graph. Loading it only when a warm-up actually
		// runs keeps that graph out of every goRoom importer.
		const { getOrCreateRoomStore, releaseRoomStore } = require('../../../views/RoomView/stores/RoomStore') as {
			getOrCreateRoomStore: typeof TGetOrCreateRoomStore;
			releaseRoomStore: typeof TReleaseRoomStore;
		};
		getOrCreateRoomStore({
			rid: routeParams.rid,
			t: routeParams.t,
			initialRoom: {
				rid: routeParams.rid,
				t: routeParams.t as string,
				name: routeParams.name,
				prid: routeParams.prid,
				visitor: routeParams.visitor
			},
			roomUserId: routeParams.roomUserId
		});
		InteractionManager.runAfterInteractions(() => releaseRoomStore(routeParams.rid));
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
