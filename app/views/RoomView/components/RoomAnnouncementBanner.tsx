import I18n from '../../../i18n';
import { useCloseBanner } from '../hooks/useCloseBanner';
import { fromSubscription, useRoomStore, useRoomStoreApi } from '../stores/RoomStoreContext';
import Banner from './Banner';

export const RoomAnnouncementBanner = () => {
	const announcement = useRoomStore(fromSubscription(room => room.announcement, undefined));
	const bannerClosed = useRoomStore(fromSubscription(room => room.bannerClosed, undefined));
	const closeBanner = useCloseBanner(useRoomStoreApi());

	return <Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />;
};
