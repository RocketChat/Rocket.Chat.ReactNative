import { useRoomStore } from '../stores/RoomStoreContext';
import { useTheme } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';
import { isSubscriptionModel } from '../../../definitions/TRoom';

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	const { theme } = useTheme();
	return useRoomStore(s => getBadgeColor({ subscription: isSubscriptionModel(s.room) ? s.room : undefined, messageId, theme }));
};
