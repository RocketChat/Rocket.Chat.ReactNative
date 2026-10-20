import { useRoute } from '@react-navigation/native';
import { useContext } from 'react';

import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { RoomsSearchContext } from '../contexts/RoomsSearchProvider';
import { useCanCreateRoom } from './useNewMessage';

export const useShowsNewMessageButton = () => {
	const canCreateRoom = useCanCreateRoom();
	const isMasterDetail = useMasterDetail();
	const { searchEnabled } = useContext(RoomsSearchContext);
	const isSearchTab = useRoute().name === 'RoomsSearchView';
	const headerOwnsNewMessageAction = hasNativeHeaderBar && isMasterDetail;

	return canCreateRoom && !searchEnabled && !isSearchTab && !headerOwnsNewMessageAction;
};
