import dayjs from '../../../lib/dayjs';
import { useRoomStore } from '../stores/RoomStoreContext';
import { type TAnyMessageModel } from '../../../definitions';
import { type IUseMessageSeparatorsResult } from '../definitions';

export const useMessageSeparators = (item: TAnyMessageModel, previousItem: TAnyMessageModel): IUseMessageSeparatorsResult => {
	'use memo';

	const lastOpen = useRoomStore(s => s.lastOpen);

	let dateSeparator = null;
	let showUnreadSeparator = false;

	const itemDate = dayjs(item.ts);

	if (!previousItem) {
		dateSeparator = item.ts;
		showUnreadSeparator = lastOpen ? itemDate.isAfter(lastOpen) : false;
	} else {
		const previousItemDate = dayjs(previousItem.ts);
		showUnreadSeparator =
			(lastOpen && (itemDate.isSame(lastOpen) || itemDate.isAfter(lastOpen)) && previousItemDate.isBefore(lastOpen)) ?? false;
		if (!itemDate.isSame(previousItem.ts, 'day')) {
			dateSeparator = item.ts;
		}
	}

	return { dateSeparator, showUnreadSeparator };
};
