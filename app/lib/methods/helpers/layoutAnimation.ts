import { LayoutAnimation } from 'react-native';

import { debounce } from './debounce';

export const animateNextTransition = debounce(
	() => {
		LayoutAnimation.configureNext({
			duration: 200,
			create: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity
			},
			update: {
				type: LayoutAnimation.Types.easeInEaseOut
			},
			delete: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity
			}
		});
	},
	200,
	true
);
