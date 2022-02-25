import { ChatsStackParamList } from '../stacks/types';
import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';
import { IVisitor, SubscriptionType } from '../definitions/ISubscription';

export interface IGoRoomItem {
	search?: boolean; // comes from spotlight
	username?: string;
	t?: SubscriptionType;
	rid?: string;
	name?: string;
	prid?: string;
	visitor?: IVisitor;
}

const navigate = ({
	item,
	isMasterDetail,
	...props
}: {
	item: IGoRoomItem;
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

export const goRoom = async ({
	item,
	isMasterDetail = false,
	...props
}: {
	item: IGoRoomItem;
	isMasterDetail: boolean;
	navigationMethod?: any;
	jumpToMessageId?: string;
	usedCannedResponse?: string;
}): Promise<void> => {
	if (item.t === SubscriptionType.DIRECT && item?.search) {
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
