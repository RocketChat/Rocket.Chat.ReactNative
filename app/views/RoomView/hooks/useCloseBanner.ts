import database from '../../../lib/database';
import { type TRoomOrPreview } from '../../../definitions/TRoom';

export function useCloseBanner(room: TRoomOrPreview): () => Promise<void> {
	return async () => {
		if ('id' in room) {
			try {
				const db = database.active;
				await db.write(async () => {
					await room.update(r => {
						r.bannerClosed = true;
					});
				});
			} catch {}
		}
	};
}
