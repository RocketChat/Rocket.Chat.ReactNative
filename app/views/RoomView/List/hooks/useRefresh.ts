import moment from 'moment';
import { useState } from 'react';

import log from '../../../../lib/methods/helpers/log';
import { loadMissedMessages, loadThreadMessages } from '../../../../lib/methods';

export const useRefresh = ({ rid, tmid, messagesLength }: { rid: string; tmid?: string; messagesLength: number }) => {
	const [refreshing, setRefreshing] = useState(false);

	const refresh = async () => {
		if (messagesLength) {
			setRefreshing(true);
			try {
				if (tmid) {
					await loadThreadMessages({ tmid, rid });
				} else {
					await loadMissedMessages({ rid, lastOpen: moment().subtract(7, 'days').toDate() });
				}
			} catch (e) {
				log(e);
			}
			setRefreshing(false);
		}
	};

	return [refreshing, refresh] as const;
};
