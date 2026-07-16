import database from '../../../lib/database';
import { type IRoomViewState } from '../definitions';

export function useCloseBanner(room: IRoomViewState['room']): () => Promise<void> {
	'use memo';

	return async () => {
		if ('id' in room) {
			try {
				const db = database.active;
				await db.write(async () => {
					await room.update(r => {
						r.bannerClosed = true;
					});
				});
			} catch {
				// do nothing
			}
		}
	};
}
