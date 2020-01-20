import { LayoutAnimation } from 'react-native';

import debounce from './debounce';
import { isIOS } from './deviceInfo';

export const animateNextTransition = debounce(() => {
	if (isIOS) {
		LayoutAnimation.easeInEaseOut();
	}
}, 200, true);
