import I18n from '../../../i18n';
import { useCloseBanner } from '../hooks/useCloseBanner';
import { useRoomStore, useRoomStoreApi } from '../stores/RoomStoreContext';
import Banner from './Banner';

export const RoomAnnouncementBanner = () => {
	const announcement = useRoomStore(s => ('announcement' in s.room ? s.room.announcement : undefined));
	const bannerClosed = useRoomStore(s => ('bannerClosed' in s.room ? s.room.bannerClosed : undefined));
	const closeBanner = useCloseBanner(useRoomStoreApi());

	return <Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />;
};
