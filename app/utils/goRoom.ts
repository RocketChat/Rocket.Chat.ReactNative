import { ChatsStackParamList } from '../stacks/types';
import Navigation from '../lib/navigation/appNavigation';
import RocketChat from '../lib/rocketchat';
import { IOmnichannelRoom, SubscriptionType, IVisitor, TSubscriptionModel, ISubscription } from '../definitions';

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

const navigate = ({
	item,
	isMasterDetail,
	...props
}: {
	item: TGoRoomItem;
	isMasterDetail: boolean;
	navigationMethod?: () => ChatsStackParamList;
}) => {
	let navigationMethod = props.navigationMethod ?? Navigation.navigate;

	if (isMasterDetail) {
		navigationMethod = Navigation.replace;
	}

	navigationMethod('RoomView', {
		rid: item.rid,
		name: RocketChat.getRoomTitle(item),
		t: item.t,
		prid: item.prid,
		room: item,
		visitor: item.visitor,
		roomUserId: RocketChat.getUidDirectMessage(item),
		...props
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
	navigationMethod?: any;
	jumpToMessageId?: string;
	usedCannedResponse?: string;
}): Promise<void> => {
	if (!('id' in item) && item.t === SubscriptionType.DIRECT && item?.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await RocketChat.createDirectMessage(username as string);
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
