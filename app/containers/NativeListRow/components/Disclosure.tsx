import { I18nManager } from 'react-native';

import ListIcon from '~/containers/List/components/ListIcon';

const Disclosure = () => (
	<ListIcon name='chevron-right' style={I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
);

export default Disclosure;
