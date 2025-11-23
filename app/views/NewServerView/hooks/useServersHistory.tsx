import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { textInputDebounceTime } from '../../../lib/constants/debounceConfig';
import { useDebounce } from '../../../lib/methods/helpers';
import { sanitizeLikeString } from '../../../lib/database/utils';
import { type TServerHistoryModel } from '../../../definitions';
import database from '../../../lib/database';

const useServersHistory = () => {
	const [serversHistory, setServersHistory] = useState<TServerHistoryModel[]>([]);

	const queryServerHistory = useDebounce(async (text?: string) => {
		const db = database.servers;
		try {
			const serversHistoryCollection = db.get('servers_history');
			let whereClause = [Q.where('username', Q.notEq(null)), Q.sortBy('updated_at', Q.desc), Q.take(3)];
			if (text) {
				const likeString = sanitizeLikeString(text);
				whereClause = [...whereClause, Q.where('url', Q.like(`%${likeString}%`))];
			}
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();

			setServersHistory(serversHistory);
		} catch {
			// Do nothing
		}
	}, textInputDebounceTime);

	const deleteServerHistory = async (item: TServerHistoryModel) => {
		const db = database.servers;
		try {
			await db.write(async () => {
				await item.destroyPermanently();
			});
			setServersHistory(prevState => prevState.filter(prevServerHistory => prevServerHistory?.id !== item?.id));
		} catch {
			// Nothing
		}
	};

	useEffect(() => {
		queryServerHistory();
	}, []);

	return {
		serversHistory,
		queryServerHistory,
		deleteServerHistory
	};
};

export default useServersHistory;
