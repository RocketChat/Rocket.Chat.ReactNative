import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';

import { useRoomStore } from '../stores/RoomStoreContext';
import { useTheme } from '../../../theme';
import Message from '../../../containers/message';
import LoadMore from '../LoadMore';
import { getBadgeColor } from '../../../lib/methods/helpers/room';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import dayjs from '../../../lib/dayjs';
import { removeInAppFeedback } from '../../../actions/inAppFeedback';
import UserPreferences from '../../../lib/methods/userPreferences';
import { NOTIFICATION_IN_APP_VIBRATION } from '../../../lib/constants/notifications';
import { type IApplicationState, type RoomType, type TAnyMessageModel } from '../../../definitions';

export type TMessageRowProps = {
	item: TAnyMessageModel;
	previousItem: TAnyMessageModel;
	highlightedMessage?: string;
	onLongPress: (item: TAnyMessageModel) => void;
};

export const MessageRow = ({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) => {
	'use memo';

	const { theme } = useTheme();
	const room = useRoomStore(s => s.room);
	const lastOpen = useRoomStore(s => s.lastOpen);
	// The room model mutates in place (same ref per emit), and the React Compiler caches derived
	// values on that stable ref. Deriving primitives inside selectors keeps them fresh per emit
	// and only re-renders the row when the derived value actually changes.
	const isIgnored = useRoomStore(s => ('id' in s.room ? s.room.ignored?.includes?.(item?.u?._id) ?? false : false));
	const threadBadgeColor = useRoomStore(s => getBadgeColor({ subscription: s.room, theme, messageId: item.id }));
	const inAppFeedbackForItem = useSelector((state: IApplicationState) => state.inAppFeedback?.[item.id]);
	const dispatch = useDispatch();

	const hapticFeedback = (msgId: string) => {
		dispatch(removeInAppFeedback(msgId));
		const notificationInAppVibration = UserPreferences.getBool(NOTIFICATION_IN_APP_VIBRATION);
		if (notificationInAppVibration || notificationInAppVibration === null) {
			try {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} catch {
				// Do nothing: Haptic is unavailable
			}
		}
	};

	let dateSeparator = null;
	let showUnreadSeparator = false;

	if (!previousItem) {
		dateSeparator = item.ts;
		showUnreadSeparator = lastOpen ? dayjs(item.ts).isAfter(lastOpen) : false;
	} else {
		showUnreadSeparator =
			(lastOpen &&
				(dayjs(item.ts).isSame(lastOpen) || dayjs(item.ts).isAfter(lastOpen)) &&
				dayjs(previousItem.ts).isBefore(lastOpen)) ??
			false;
		if (!dayjs(item.ts).isSame(previousItem.ts, 'day')) {
			dateSeparator = item.ts;
		}
	}

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
		if (inAppFeedbackForItem) {
			hapticFeedback(item.id);
		}
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
