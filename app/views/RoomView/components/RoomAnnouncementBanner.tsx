import I18n from '../../../i18n';
import { useCloseBanner } from '../hooks/useCloseBanner';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useRoom } from '../stores/RoomStoreContext';
import Banner from './Banner';

const getAnnouncement = (snapshot: RoomSnapshot): { text?: string; bannerClosed?: boolean } | null => {
	const room = getRoom(snapshot);
	return 'id' in room ? { text: room.announcement, bannerClosed: room.bannerClosed } : null;
};

export const RoomAnnouncementBanner = () => {
	const { room, snapshot } = useRoom();
	const closeBanner = useCloseBanner(room);
	const announcement = getAnnouncement(snapshot);

	if (!announcement) {
		return null;
	}
	return (
		<Banner
			title={I18n.t('Announcement')}
			text={announcement.text}
			bannerClosed={announcement.bannerClosed}
			closeBanner={closeBanner}
		/>
	);
};
