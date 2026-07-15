import { useRoomStore } from '../stores/RoomStoreContext';
import Message from '../../../containers/message';
import LoadMore from '../LoadMore';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { type RoomType } from '../../../definitions';
import { useIsIgnored } from '../hooks/useIsIgnored';
import { useThreadBadgeColor } from '../hooks/useThreadBadgeColor';
import { useMessageSeparators } from '../hooks/useMessageSeparators';
import { type TMessageRowProps } from '../definitions';

export const MessageRow = ({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) => {
	'use memo';

	const room = useRoomStore(s => s.room);
	const isIgnored = useIsIgnored(item?.u?._id);
	const threadBadgeColor = useThreadBadgeColor(item.id);
	const { dateSeparator, showUnreadSeparator } = useMessageSeparators(item, previousItem);

	let content = null;
	if (item.t && MESSAGE_TYPE_ANY_LOAD.includes(item.t as MessageTypeLoad)) {
		const runOnRender = () => {
			if (item.t === MessageTypeLoad.MORE) {
				if (!previousItem) return true;
				if (previousItem?.tmid) return true;
			}
			return false;
		};
		content = (
			<LoadMore
				rid={room.rid}
				t={room.t as RoomType}
				loaderId={item.id}
				type={item.t}
				runOnRender={runOnRender()}
				dateSeparator={dateSeparator}
				showUnreadSeparator={showUnreadSeparator}
			/>
		);
	} else {
		content = (
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
	}

	return content;
};
