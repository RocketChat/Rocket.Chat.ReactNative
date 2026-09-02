import { useRoomStore } from '../../../lib/store/RoomStoreContext';
import { useTheme } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	const { theme } = useTheme();

	return useRoomStore(s => getBadgeColor({ subscription: s.room, messageId, theme }));
};
