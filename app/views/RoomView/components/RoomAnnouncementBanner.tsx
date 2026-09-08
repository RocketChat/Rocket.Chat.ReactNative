import I18n from '../../../i18n';
import { useCloseBanner } from '../hooks/useCloseBanner';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useRoom } from '../stores/RoomStoreContext';
import Banner from './Banner';

const hasAnnouncement = (snapshot: RoomSnapshot): boolean => 'id' in getRoom(snapshot);

const getAnnouncementText = (snapshot: RoomSnapshot): string | undefined => {
	const room = getRoom(snapshot);
	return 'id' in room ? room.announcement : undefined;
};

const isBannerClosed = (snapshot: RoomSnapshot): boolean | undefined => {
	const room = getRoom(snapshot);
	return 'id' in room ? room.bannerClosed : undefined;
};

export const RoomAnnouncementBanner = () => {
	const { room, snapshot } = useRoom();
	const closeBanner = useCloseBanner(room);

	if (!hasAnnouncement(snapshot)) {
		return null;
	}
	return (
		<Banner
			title={I18n.t('Announcement')}
			text={getAnnouncementText(snapshot)}
			bannerClosed={isBannerClosed(snapshot)}
			closeBanner={closeBanner}
		/>
	);
};
