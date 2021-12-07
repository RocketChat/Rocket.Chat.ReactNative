import { IRoom, RoomType } from '../definitions/IRoom';
import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';

const navigate = ({ item, isMasterDetail, ...props }: { item: IItem; isMasterDetail: boolean; navigationMethod?: any }) => {
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

interface IItem extends Partial<IRoom> {
	rid: string;
	name: string;
	t: RoomType;
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
						t: RoomType.DIRECT
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
