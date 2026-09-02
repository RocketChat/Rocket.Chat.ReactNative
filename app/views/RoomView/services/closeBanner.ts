import database from '../../../lib/database';
import { type IRoomViewState } from '../definitions';

export const closeBanner = (room: IRoomViewState['room']) => async (): Promise<void> => {
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
