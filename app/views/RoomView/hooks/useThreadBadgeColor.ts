import { useRoomStore } from '../stores/RoomStoreContext';
import { useTheme } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	'use memo';

	const { theme } = useTheme();

	return useRoomStore(s => getBadgeColor({ subscription: s.room, messageId, theme }));
};
