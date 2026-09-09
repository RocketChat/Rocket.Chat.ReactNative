import { useRoomStore } from '../stores/RoomStoreContext';
import { useTheme } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	const { theme } = useTheme();
	const tunreadUser = useRoomStore(s => ('id' in s.room ? s.room.tunreadUser : undefined));
	const tunreadGroup = useRoomStore(s => ('id' in s.room ? s.room.tunreadGroup : undefined));
	const tunread = useRoomStore(s => ('id' in s.room ? s.room.tunread : undefined));

	return getBadgeColor({ subscription: { tunreadUser, tunreadGroup, tunread }, messageId, theme });
};
