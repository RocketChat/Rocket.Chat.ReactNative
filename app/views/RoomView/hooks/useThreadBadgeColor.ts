import { useRoom } from '../stores/RoomStoreContext';
import { useTheme, type TSupportedThemes } from '../../../theme';
import { getBadgeColor } from '../../../lib/methods/helpers/room';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';

const getThreadBadgeColor = (snapshot: RoomSnapshot, messageId: string, theme: TSupportedThemes): string | undefined =>
	getBadgeColor({ subscription: getRoom(snapshot), messageId, theme });

export const useThreadBadgeColor = (messageId: string): string | undefined => {
	const { theme } = useTheme();
	const { snapshot } = useRoom();

	return getThreadBadgeColor(snapshot, messageId, theme);
};
