import dayjs from '../../../lib/dayjs';
import { useRoomStore } from '../stores/RoomStoreContext';
import { type TAnyMessageModel } from '../../../definitions';
import { type IUseMessageSeparatorsResult } from '../definitions';

export const useMessageSeparators = (item: TAnyMessageModel, previousItem: TAnyMessageModel): IUseMessageSeparatorsResult => {
	const lastSeen = useRoomStore(s => s.lastSeen);

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
