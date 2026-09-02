import dayjs from '../../../lib/dayjs';
import { useRoomStore } from '../../../lib/store/RoomStoreContext';
import { useRoomScreen } from '../stores/RoomScreenContext';
import Message from '../../../containers/message';
import LoadMore from '../LoadMore';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { type RoomType, type TAnyMessageModel } from '../../../definitions';
import { useThreadBadgeColor } from '../hooks/useThreadBadgeColor';
import { type IRoomViewState } from '../definitions';

type TMessageRowProps = {
	item: TAnyMessageModel;
	previousItem: TAnyMessageModel;
	highlightedMessage?: string;
	onLongPress: (item: TAnyMessageModel) => void;
};

// The room model mutates in place (same ref per emit), and the React Compiler caches derived
// values on that stable ref. Deriving the boolean inside the selector keeps it fresh per emit
// and only re-renders the caller when the derived value actually changes.
const useIsIgnored = (authorId?: string): boolean =>
	useRoomStore(s => (authorId && 'id' in s.room ? (s.room.ignored?.includes(authorId) ?? false) : false));

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
	const room = useRoomStore(s => s.room);
	const isIgnored = useIsIgnored(item?.u?._id);
	const threadBadgeColor = useThreadBadgeColor(item.id);
	const { lastSeen } = useRoomScreen();
	const { dateSeparator, showUnreadSeparator } = getMessageSeparators(item, previousItem, lastSeen);

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
