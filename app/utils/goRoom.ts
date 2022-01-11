import { ChatsStackParamList } from '../stacks/types';
import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';
import { ISubscription, SubscriptionType } from '../definitions/ISubscription';

const navigate = ({
	item,
	isMasterDetail,
	...props
}: {
	item: IItem;
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

interface IItem extends Partial<ISubscription> {
	rid: string;
	name: string;
	t: SubscriptionType;
}

export const goRoom = async ({
	item,
	isMasterDetail = false,
	...props
}: {
	item: IItem;
	isMasterDetail: boolean;
	navigationMethod?: any;
	jumpToMessageId?: string;
}): Promise<void> => {
	if (item.t === 'd' && item.search) {
		// if user is using the search we need first to join/create room
		try {
			const { username } = item;
			const result = await RocketChat.createDirectMessage(username);
			if (result.success) {
				return navigate({
					item: {
						rid: result.room._id,
						name: username!,
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
