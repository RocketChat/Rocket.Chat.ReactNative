import dayjs from '../../../lib/dayjs';
import { useRoomScreen } from '../stores/RoomScreenContext';
import { type TAnyMessageModel } from '../../../definitions';
import { type IUseMessageSeparatorsResult } from '../definitions';

export const useMessageSeparators = (item: TAnyMessageModel, previousItem: TAnyMessageModel): IUseMessageSeparatorsResult => {
	const { lastSeen } = useRoomScreen();

	let dateSeparator = null;
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
