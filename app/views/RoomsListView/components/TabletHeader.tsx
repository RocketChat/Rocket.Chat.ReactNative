import { useNavigation, useRoute } from '@react-navigation/native';
import { memo } from 'react';

import Header from '../../../containers/Header';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useHeader } from '../hooks/useHeader';

const TabletHeader = () => {
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { options } = useHeader();

	if (!isMasterDetail || !options) {
		return null;
	}

	return <Header options={options} navigation={navigation} route={route} />;
};

export default memo(TabletHeader);
