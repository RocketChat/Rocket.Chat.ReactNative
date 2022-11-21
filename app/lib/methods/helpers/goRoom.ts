import { CommonActions } from '@react-navigation/native';

import Navigation from '../../navigation/appNavigation';
import { IOmnichannelRoom, SubscriptionType, IVisitor, TSubscriptionModel, ISubscription } from '../../../definitions';
import { getRoomTitle, getUidDirectMessage } from './helpers';
import { Services } from '../../services';

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

	if (isMasterDetail) {
		return Navigation.reset((state: any) => {
			const routesChatsStackNavigator = state.routes.filter((r: any) => r.name === 'ChatsStackNavigator');
			if (routesChatsStackNavigator.length > 0) {
				return CommonActions.reset({
					index: 0,
					routes: [
						{
							...routesChatsStackNavigator[0],
							state: {
								routes: [
									{
										name: 'RoomView',
										params: routeParams
									}
								]
							}
						}
					]
				});
			}

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

	return Navigation.reset((state: any) => {
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
			const result = await Services.createDirectMessage(username as string);
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
		} catch {
			// Do nothing
		}
	}

	return navigate({ item, isMasterDetail, ...props });
};
