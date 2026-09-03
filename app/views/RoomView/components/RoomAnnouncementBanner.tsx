import I18n from '../../../i18n';
import { useCloseBanner } from '../hooks/useCloseBanner';
import { useRoomStore } from '../stores/RoomStoreContext';
import Banner from './Banner';

export const RoomAnnouncementBanner = () => {
	const room = useRoomStore(s => s.room);
	const closeBanner = useCloseBanner(room);

	if (!('id' in room)) {
		return null;
	}
	return (
		<Banner title={I18n.t('Announcement')} text={room.announcement} bannerClosed={room.bannerClosed} closeBanner={closeBanner} />
	);
};
