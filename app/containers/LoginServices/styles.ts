import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const BUTTON_HEIGHT = 48;
export const SERVICE_HEIGHT = 58;
export const BORDER_RADIUS = 4;
export const SERVICES_COLLAPSED_HEIGHT = 174;

export default StyleSheet.create({
	serviceButton: {
		borderRadius: BORDER_RADIUS,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: BORDER_RADIUS,
		width: '100%',
		height: BUTTON_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15,
		top: 12,
		width: 24,
		height: 24
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	serviceName: {
		...sharedStyles.textSemibold
	},
	options: {
		marginBottom: 0
	}
});
