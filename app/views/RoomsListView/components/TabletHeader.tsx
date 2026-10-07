import { useNavigation, useRoute } from '@react-navigation/native';
import { memo } from 'react';

import Header from '~/containers/Header';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useJsRoomsListHeader } from '../hooks/useJsRoomsListHeader';

const TabletHeader = () => {
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const isMasterDetail = useMasterDetail();
	const { options } = useJsRoomsListHeader();

	if (!isMasterDetail || !options) {
		return null;
	}

	return <Header options={options} navigation={navigation} route={route} />;
};

export default memo(TabletHeader);
