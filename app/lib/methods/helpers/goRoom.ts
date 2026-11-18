import { CommonActions } from '@react-navigation/native';

import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import Navigation from '~/lib/navigation/appNavigation';
import { type IOmnichannelRoom, RoomType } from '~/definitions/IRoom';
import { type IVisitor, type TSubscriptionModel, type ISubscription } from '~/definitions/ISubscription';
import { getRoomTitle } from './getRoomTitle';
import { getUidDirectMessage } from './getUidDirectMessage';
import { createDirectMessage } from '../createDirectMessage';
import { emitErrorCreateDirectMessage } from './emitErrorCreateDirectMessage';
import { getRoomInfo } from '~/lib/services/restApi';
import { type ChatsStackParamList } from '~/stacks/types';
import log from './log';

interface IGoRoomItem {
	search?: boolean; // comes from spotlight
	username?: string;
	t?: RoomType;
	rid?: string;
	name?: string;
	fname?: string;
	prid?: string;
	uids?: string[];
	usernames?: string[];
	visitor?: IVisitor;
	joinCodeRequired?: boolean;
}

export type TGoRoomItem = IGoRoomItem | TSubscriptionModel | ISubscription | IOmnichannelRoomVisitor;

type TRoutableRoomItem = TGoRoomItem & { rid: string; t: RoomType };

const ROOMS_LIST_ROUTES = ['RoomsListView', 'CategoryView'];

let latestRoomRequest = 0;

const requestRoom = () => {
	latestRoomRequest += 1;
	const request = latestRoomRequest;
	return { isLatest: () => request === latestRoomRequest };
};

const navigate = ({ item, isMasterDetail, ...props }: { item: TRoutableRoomItem; isMasterDetail: boolean }) => {
	const routeParams: NonNullable<ChatsStackParamList['RoomView']> = {
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
	if (currentRoute?.name === 'RoomView' && currentRoute?.params?.rid === item.rid && !currentRoute?.params?.tmid) {
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
		const routesRoomsList = state.routes.filter((r: any) => ROOMS_LIST_ROUTES.includes(r.name));
		return CommonActions.reset({
			...state,
			routes: [
				...routesRoomsList,
				{
					name: 'RoomView',
					params: routeParams
				}
			],
			index: routesRoomsList.length
		});
	});
};

interface IOmnichannelRoomVisitor extends IOmnichannelRoom {
	// this visitor came from ee/omnichannel/views/QueueListView
	visitor: IVisitor;
}

const completeRoomItem = async (item: TGoRoomItem): Promise<TRoutableRoomItem | null> => {
	const { rid, t } = item;
	if (!rid) {
		return null;
	}
	const subscription = await getSubscriptionByRoomId(rid);
	if (subscription) {
		return subscription;
	}
	if (t) {
		return { ...item, rid, t };
	}
	const roomInfo = await getRoomInfo(rid).catch(error => {
		log(error);
		return null;
	});
	if (!roomInfo?.success) {
		return null;
	}
	const { name, fname, prid, uids, usernames } = roomInfo.room;
	return { ...item, rid, t: roomInfo.room.t, name, fname, prid, uids, usernames };
};

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
	const request = requestRoom();
	if (!('id' in item) && item.t === RoomType.DIRECT && item?.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await createDirectMessage(username as string);
			if (!request.isLatest()) {
				return;
			}
			if (result.success && result?.room?._id) {
				return navigate({
					item: {
						rid: result.room._id,
						name: username || '',
						t: RoomType.DIRECT
					},
					isMasterDetail,
					...props
				});
			}
		} catch (e: any) {
			emitErrorCreateDirectMessage(e?.data);
		}
	}

	const room = await completeRoomItem(item);
	if (!room || !request.isLatest()) {
		return;
	}
	return navigate({ item: room, isMasterDetail, ...props });
};

export const navigateToRoom: typeof navigate = params => {
	requestRoom();
	return navigate(params);
};
