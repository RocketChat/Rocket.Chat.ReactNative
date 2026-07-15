import dayjs from '../../../lib/dayjs';
import { useRoomStore } from '../stores/RoomStoreContext';
import { type TAnyMessageModel } from '../../../definitions';
import { type IUseMessageSeparatorsResult } from '../definitions';

export const useMessageSeparators = (item: TAnyMessageModel, previousItem: TAnyMessageModel): IUseMessageSeparatorsResult => {
	'use memo';

	const lastOpen = useRoomStore(s => s.lastOpen);

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

	return { dateSeparator, showUnreadSeparator };
};
