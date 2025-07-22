import { useNavigation, useRoute } from '@react-navigation/native';

import Header from './Header';
import { useAppSelector } from '../../../lib/hooks';

const TabletHeader = () => {
	const navigation = useNavigation<any>();
	const route = useRoute<any>();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	if (!isMasterDetail) {
		return null;
	}

	// const options = this.getHeader();
	// @ts-ignore
	return <Header options={{} as any} navigation={navigation} route={route} />;
};

export default TabletHeader;
