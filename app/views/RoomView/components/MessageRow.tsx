import { memo } from 'react';

import { useRoomStore } from '../stores/RoomStoreContext';
import { useRoomScreen } from '../stores/RoomScreenContext';
import Message from '../../../containers/message';
import { getMessageSeparators } from '../../../containers/message/utils';
import LoadMore from '../LoadMore';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { type RoomType } from '../../../definitions';
import { useThreadBadgeColor } from '../hooks/useThreadBadgeColor';
import { type TMessageRowProps } from '../definitions';
import { isSubscriptionModel } from '../../../definitions/TRoom';

const useIsIgnored = (authorId?: string): boolean =>
	useRoomStore(s => (authorId && isSubscriptionModel(s.room) ? (s.room.ignored?.includes(authorId) ?? false) : false));

export const MessageRow = memo(function MessageRow({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) {
	const rid = useRoomStore(s => s.room.rid);
	const t = useRoomStore(s => s.room.t) as RoomType;
	const isIgnored = useIsIgnored(item?.u?._id);
	const threadBadgeColor = useThreadBadgeColor(item.id);
	const { lastSeen } = useRoomScreen();

	if (item.t && MESSAGE_TYPE_ANY_LOAD.includes(item.t as MessageTypeLoad)) {
		const { dateSeparator, showUnreadSeparator } = getMessageSeparators(previousItem, item, lastSeen);
		const runOnRender = item.t === MessageTypeLoad.MORE && (!previousItem || !!previousItem.tmid);
		return (
			<LoadMore
				rid={rid}
				t={t}
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
			lastSeen={lastSeen}
			withSeparators
			onLongPress={onLongPress}
			threadBadgeColor={threadBadgeColor}
			highlighted={highlightedMessage === item.id}
		/>
	);
});
