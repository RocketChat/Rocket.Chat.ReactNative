import { I18nManager } from 'react-native';

import ListIcon from './List/components/ListIcon';
import { useIsNativeList } from './List/native/context';
import Indicator from './NativeListRow/components/Indicator';

const NewWindowIcon = ({ size }: { size?: number }) => {
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return <Indicator indicator='external' />;
	}

	return <ListIcon name='new-window' size={size} style={I18nManager.isRTL ? { transform: [{ rotateY: '180deg' }] } : null} />;
};

export default NewWindowIcon;
