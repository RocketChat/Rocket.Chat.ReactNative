import { useRoute } from '@react-navigation/native';

import { useMasterDetail } from '~/lib/hooks/useMasterDetail';

export type TRoomTypeFilter = 'all' | 'directMessages' | 'withoutDirectMessages';

export const useRoomTypeFilter = (): TRoomTypeFilter => {
	const routeName = useRoute().name;
	const isMasterDetail = useMasterDetail();

	if (routeName === 'DirectMessagesView') {
		return 'directMessages';
	}
	if (routeName === 'RoomsListView' && !isMasterDetail) {
		return 'withoutDirectMessages';
	}
	return 'all';
};
