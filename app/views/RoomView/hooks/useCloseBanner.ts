import database from '../../../lib/database';
import { type RoomStore } from '../definitions';

export function useCloseBanner(roomStore: RoomStore): () => Promise<void> {
	return async () => {
		const { room } = roomStore.getState();
		if (!('id' in room)) {
			return;
		}
		try {
			const db = database.active;
			await db.write(async () => {
				await room.update(r => {
					r.bannerClosed = true;
				});
			});
		} catch {}
	};
}
