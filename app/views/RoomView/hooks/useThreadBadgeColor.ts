import { fromSubscription, useRoomStore } from '../stores/RoomStoreContext';
import { useTheme } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	const { theme } = useTheme();
	return useRoomStore(fromSubscription(room => getBadgeColor({ subscription: room, messageId, theme }), undefined));
};
