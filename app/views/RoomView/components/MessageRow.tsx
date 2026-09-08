import dayjs from '../../../lib/dayjs';
import { useRoom } from '../stores/RoomStoreContext';
import { useRoomScreen } from '../stores/RoomScreenContext';
import Message from '../../../containers/message';
import LoadMore from '../LoadMore';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { type RoomType, type TAnyMessageModel } from '../../../definitions';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useThreadBadgeColor } from '../hooks/useThreadBadgeColor';
import { type IRoomViewState, type TMessageRowProps } from '../definitions';

const isAuthorIgnored = (snapshot: RoomSnapshot, authorId?: string): boolean => {
	const room = getRoom(snapshot);
	return !!authorId && 'id' in room && (room.ignored?.includes(authorId) ?? false);
};

const getMessageSeparators = (item: TAnyMessageModel, previousItem: TAnyMessageModel, lastSeen: IRoomViewState['lastSeen']) => {
	let dateSeparator: TAnyMessageModel['ts'] | null = null;
	let showUnreadSeparator = false;

	const itemDate = dayjs(item.ts);

	if (!previousItem) {
		dateSeparator = item.ts;
		showUnreadSeparator = lastSeen ? itemDate.isAfter(lastSeen) : false;
	} else {
		const previousItemDate = dayjs(previousItem.ts);
		showUnreadSeparator =
			(lastSeen && (itemDate.isSame(lastSeen) || itemDate.isAfter(lastSeen)) && previousItemDate.isBefore(lastSeen)) ?? false;
		if (!itemDate.isSame(previousItem.ts, 'day')) {
			dateSeparator = item.ts;
		}
	}

	return { dateSeparator, showUnreadSeparator };
};

export const MessageRow = ({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) => {
	const { room, snapshot } = useRoom();
	const isIgnored = isAuthorIgnored(snapshot, item?.u?._id);
	const threadBadgeColor = useThreadBadgeColor(item.id);
	const { lastSeen } = useRoomScreen();
	const { dateSeparator, showUnreadSeparator } = getMessageSeparators(item, previousItem, lastSeen);

	if (item.t && MESSAGE_TYPE_ANY_LOAD.includes(item.t as MessageTypeLoad)) {
		const runOnRender = item.t === MessageTypeLoad.MORE && (!previousItem || !!previousItem.tmid);
		return (
			<LoadMore
				rid={room.rid}
				t={room.t as RoomType}
				loaderId={item.id}
				type={item.t}
				runOnRender={runOnRender}
				dateSeparator={dateSeparator}
				showUnreadSeparator={showUnreadSeparator}
			/>
		);
	}

	return (
		<Message
			item={item}
			isIgnored={isIgnored}
			previousItem={previousItem}
			onLongPress={onLongPress}
			threadBadgeColor={threadBadgeColor}
			highlighted={highlightedMessage === item.id}
			dateSeparator={dateSeparator}
			showUnreadSeparator={showUnreadSeparator}
		/>
	);
};
