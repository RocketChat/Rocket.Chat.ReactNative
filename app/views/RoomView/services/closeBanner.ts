import database from '../../../lib/database';
import { type IRoomViewState } from '../definitions';

export const closeBanner = async (room: IRoomViewState['room']): Promise<void> => {
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
