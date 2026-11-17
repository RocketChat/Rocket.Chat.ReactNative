import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { events, logEvent } from '~/lib/methods/helpers/log';

export const useNewMessage = (categoryId?: string) => {
	const navigation = useNavigation<any>();
	const isMasterDetail = useMasterDetail();
	const createPermissions = usePermissions(['create-c', 'create-p', 'create-team', 'create-d', 'start-discussion']);
	const canCreateRoom = createPermissions.some(permission => permission === true);

	const goToNewMessage = useCallback(() => {
		logEvent(events.RL_GO_NEW_MSG);
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView', params: { categoryId } });
		} else {
			navigation.navigate('NewMessageStackNavigator', { screen: 'NewMessageView', params: { categoryId } });
		}
	}, [isMasterDetail, navigation, categoryId]);

	return { canCreateRoom, goToNewMessage };
};
